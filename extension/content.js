console.log("FreezeShield content script is running!");

let saveTimer;
let isRestoring = false;


// ==========================================
// SESSION ID
// ==========================================

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


// ==========================================
// STABLE URL
// ==========================================

function getStableUrl() {

    const url = new URL(
        window.location.href
    );

    // Remove IntelliJ development parameters
    url.searchParams.delete("_ijt");
    url.searchParams.delete("_ij_reload");

    return url.toString();
}


// ==========================================
// SENSITIVE FIELD DETECTION
// ==========================================

function isSensitiveField(element) {

    const type =
        (element.type || "").toLowerCase();

    const autocomplete =
        (element.autocomplete || "").toLowerCase();

    const name =
        (element.name || "").toLowerCase();

    const id =
        (element.id || "").toLowerCase();


    // ------------------------------------------
    // Password fields
    // ------------------------------------------

    if (type === "password") {
        return true;
    }


    // ------------------------------------------
    // Hidden fields
    // ------------------------------------------

    if (type === "hidden") {
        return true;
    }


    // ------------------------------------------
    // Sensitive autocomplete values
    // ------------------------------------------

    const sensitiveAutocomplete = [

        "current-password",
        "new-password",
        "one-time-code",

        "cc-number",
        "cc-csc",
        "cc-exp",
        "cc-exp-month",
        "cc-exp-year"
    ];


    if (
        sensitiveAutocomplete.includes(
            autocomplete
        )
    ) {
        return true;
    }


    // ------------------------------------------
    // Sensitive field names / IDs
    // ------------------------------------------

    const sensitivePatterns = [

        "password",
        "passwd",

        "otp",
        "verification-code",
        "verificationcode",

        "cvv",
        "cvc",

        "credit-card",
        "creditcard",

        "card-number",
        "cardnumber"
    ];


    const fieldIdentifier =
        `${name} ${id}`;


    return sensitivePatterns.some(
        pattern =>
            fieldIdentifier.includes(pattern)
    );
}



// ==========================================
// CAPTURE PAGE STATE
// ==========================================

function getPageState() {

    const sessionId =
        getSessionId();


    const elements =
        document.querySelectorAll(
            "input, textarea, select, [contenteditable='true']"
        );


    const fields = [];


    elements.forEach(
        (element, index) => {

            // ------------------------------------------
            // Skip sensitive fields
            // ------------------------------------------

            if (
                isSensitiveField(element)
            ) {

                console.log(
                    "Skipping sensitive field:",
                    element
                );

                return;
            }


            fields.push({

                index: index,

                tag: element.tagName,

                type:
                    element.type ||
                    null,

                name:
                    element.name ||
                    null,

                id:
                    element.id ||
                    null,

                value:
                    element.type === "checkbox" ||
                    element.type === "radio"

                        ? element.checked

                        : element.value ||
                          element.innerText ||
                          ""
            });
        }
    );


    return {

        sessionId:
            sessionId,

        tabUrl:
            getStableUrl(),

        formData:
            JSON.stringify(fields),

        scrollX:
            window.scrollX,

        scrollY:
            window.scrollY
    };
}

// ==========================================
// SET FIELD VALUE
// ==========================================

function setFieldValue(element, value) {

    // ------------------------------------------
    // SELECT
    // ------------------------------------------

    if (element.tagName === "SELECT") {

        element.value = value;

        element.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );

        return;
    }


    // ------------------------------------------
    // CHECKBOX / RADIO
    // ------------------------------------------

    if (
        element.type === "checkbox" ||
        element.type === "radio"
    ) {

        element.checked =
            value === true ||
            value === "true";

        element.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );

        return;
    }


    // ------------------------------------------
    // CONTENTEDITABLE
    // ------------------------------------------

    if (element.isContentEditable) {

        element.innerText = value;

        element.dispatchEvent(
            new InputEvent("input", {
                bubbles: true,
                inputType: "insertText",
                data: value
            })
        );

        return;
    }


    // ------------------------------------------
    // INPUT / TEXTAREA
    // ------------------------------------------

    const prototype =
        Object.getPrototypeOf(element);

    const valueSetter =
        Object.getOwnPropertyDescriptor(
            prototype,
            "value"
        )?.set;


    if (valueSetter) {

        valueSetter.call(
            element,
            value
        );

    } else {

        element.value = value;
    }


    // Tell JavaScript frameworks
    // that the value changed.

    element.dispatchEvent(
        new Event("input", {
            bubbles: true
        })
    );


    element.dispatchEvent(
        new Event("change", {
            bubbles: true
        })
    );
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

        // Ask background service worker
        // to fetch saved state from backend

        const response =
            await chrome.runtime.sendMessage({

                type: "RESTORE_STATE",

                sessionId: sessionId,

                url: currentUrl
            });


        // ------------------------------------------
        // Background request failed
        // ------------------------------------------

        if (!response.success) {

            console.error(
                "Restore failed:",
                response.error
            );

            return;
        }


        const savedState =
            response.data;


        // ------------------------------------------
        // No saved state
        // ------------------------------------------

        if (!savedState) {

            console.log(
                "No saved state found."
            );

            return;
        }


        console.log(
            "Saved state found:",
            savedState
        );


        // ------------------------------------------
        // Parse saved form data
        // ------------------------------------------

        const fields =
            JSON.parse(
                savedState.formData
            );


        // ------------------------------------------
        // Restore each field
        // ------------------------------------------

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


            // Field no longer exists

            if (!element) {

                console.log(
                    "Could not find field:",
                    field
                );

                return;
            }


            // SELECT

                setFieldValue(
                    element,
                    field.value
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

        isRestoring = false;

        console.log(
            "FreezeShield restoration finished."
        );
    }
}


// ==========================================
// SAVE PAGE STATE
// ==========================================

async function savePageState() {

    const tabState =
        getPageState();


    console.log(
        "Saving real page state:",
        tabState
    );


    try {

        // Send state to background service worker

        const response =
            await chrome.runtime.sendMessage({

                type: "SAVE_STATE",

                data: tabState
            });


        // ------------------------------------------
        // Save successful
        // ------------------------------------------

        if (response.success) {

            console.log(
                "Real page state saved:",
                response.data
            );
        }


        // ------------------------------------------
        // Save failed
        // ------------------------------------------

        else {

            console.error(
                "Backend error:",
                response.error
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


    // Cancel previous timer

    clearTimeout(
        saveTimer
    );


    // Wait 1 second after the
    // user stops making changes.

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


// ==========================================
// START RESTORATION
// ==========================================

restoreState();