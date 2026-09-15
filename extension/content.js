console.log("FreezeShield content script is running!");

let saveTimer;
let isRestoring = false;

function getSessionId() {

    let sessionId = sessionStorage.getItem(
        "freezeShieldSessionId"
    );

    if (!sessionId) {

        sessionId = crypto.randomUUID();

        sessionStorage.setItem(
            "freezeShieldSessionId",
            sessionId
        );

        console.log(
            "Created new FreezeShield page session:",
            sessionId
        );

    } else {

        console.log(
            "Recovered existing FreezeShield page session:",
            sessionId
        );
    }

    return sessionId;
}


function getStableUrl() {

    const url = new URL(
        window.location.href
    );

    // Remove IntelliJ development parameters
    url.searchParams.delete("_ijt");
    url.searchParams.delete("_ij_reload");

    return url.toString();
}

function getPageState() {

    const sessionId = getSessionId();

    const elements = document.querySelectorAll(
        "input:not([type='password']), textarea, select, [contenteditable='true']"
    );

    const fields = [];

    elements.forEach((element, index) => {

        fields.push({

            index: index,

            tag: element.tagName,

            type: element.type || null,

            name: element.name || null,

            id: element.id || null,

            value:
                element.value ||
                element.innerText ||
                ""
        });

    });

    return {

        sessionId: sessionId,

        tabUrl: getStableUrl(),

        formData: JSON.stringify(fields),

        scrollX: window.scrollX,

        scrollY: window.scrollY
    };
}


// ==========================================
// RESTORE SAVED STATE
// ==========================================

async function restoreState() {

    isRestoring = true;

    const currentUrl = getStableUrl();

    const sessionId = getSessionId();

    console.log(
        "Checking for saved state..."
    );

    console.log(
        "Session ID:",
        sessionId
    );

    try {

        const response = await fetch(

            `http://localhost:8080/api/v1/tab-states?sessionId=${encodeURIComponent(sessionId)}&url=${encodeURIComponent(currentUrl)}`
        );



        if (response.status === 404) {

            console.log(
                "No saved state found."
            );

            return;
        }


        if (!response.ok) {

            console.error(
                "Restore failed:",
                response.status
            );

            return;
        }


        const savedState =
            await response.json();

        console.log(
            "Saved state found:",
            savedState
        );


        const fields =
            JSON.parse(
                savedState.formData
            );


        fields.forEach(field => {

            let element = null;


            // Try ID first
            if (field.id) {

                element =
                    document.getElementById(
                        field.id
                    );
            }


            // Try name if ID failed
            if (!element && field.name) {

                element =
                    document.querySelector(
                        `[name="${CSS.escape(field.name)}"]`
                    );
            }


            // Field doesn't exist anymore
            if (!element) {

                console.log(
                    "Could not find field:",
                    field
                );

                return;
            }


            // SELECT
            if (
                element.tagName === "SELECT"
            ) {

                element.value =
                    field.value;
            }


            // CONTENTEDITABLE
            else if (
                element.isContentEditable
            ) {

                element.innerText =
                    field.value;
            }


            // INPUT / TEXTAREA
            else {

                element.value =
                    field.value;
            }


            // Tell webpage about restored value
            element.dispatchEvent(
                new Event(
                    "input",
                    {
                        bubbles: true
                    }
                )
            );


            element.dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles: true
                    }
                )
            );

        });


        // ------------------------------------------
        // Restore scroll position
        // ------------------------------------------

        window.scrollTo(

            savedState.scrollX || 0,

            savedState.scrollY || 0
        );


        console.log(
            "State restored successfully!"
        );

    }

    catch (error) {

        console.error(
            "Could not restore state:",
            error
        );

    }

    finally {

        // Restoration is complete.
        // User changes can now be saved again.

        isRestoring = false;

        console.log(
            "FreezeShield restoration finished."
        );
    }
}



async function savePageState() {

    const tabState =
        getPageState();

    console.log(
        "Saving real page state:",
        tabState
    );

    try {

        const response =
            await fetch(
                "http://localhost:8080/api/v1/tab-states",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            tabState
                        )
                }
            );

        if (response.ok) {

            const savedState =
                await response.json();

            console.log(
                "Real page state saved:",
                savedState
            );

        }


        // ------------------------------------------
        // Backend error
        // ------------------------------------------

        else {

            console.error(
                "Backend error:",
                response.status
            );
        }

    }

    catch (error) {

        console.error(
            "Could not connect to backend:",
            error
        );
    }
}


// ==========================================
// USER CHANGE HANDLER
// ==========================================

function handleUserChange() {

    // Ignore events generated while
    // FreezeShield is restoring saved state.

    if (isRestoring) {

        return;
    }


    // Cancel previous save timer

    clearTimeout(
        saveTimer
    );


    // Wait until user stops typing/changing fields

    saveTimer =
        setTimeout(
            savePageState,
            1000
        );
}


// ==========================================
// LISTEN FOR USER CHANGES
// ==========================================

document.addEventListener(
    "input",
    handleUserChange
);

document.addEventListener(
    "change",
    handleUserChange
);


restoreState();