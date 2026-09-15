console.log("FreezeShield background service worker started!");


// ==========================================
// BACKEND CONFIGURATION
// ==========================================

const BACKEND_URL =
    "http://localhost:8080/api/v1/tab-states";


// ==========================================
// MESSAGE HANDLER
// ==========================================

chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        console.log(
            "Message received:",
            message.type
        );


        // ------------------------------------------
        // SAVE STATE
        // ------------------------------------------

        if (message.type === "SAVE_STATE") {

            handleSaveState(
                message.data
            )
                .then(result => {

                    sendResponse({
                        success: true,
                        data: result
                    });

                })
                .catch(error => {

                    console.error(
                        "Save request failed:",
                        error
                    );

                    sendResponse({
                        success: false,
                        error: error.message
                    });
                });


            // Keep message channel open
            return true;
        }


        // ------------------------------------------
        // RESTORE STATE
        // ------------------------------------------

        if (message.type === "RESTORE_STATE") {

            handleRestoreState(
                message.sessionId,
                message.url
            )
                .then(result => {

                    sendResponse({
                        success: true,
                        data: result
                    });

                })
                .catch(error => {

                    console.error(
                        "Restore request failed:",
                        error
                    );

                    sendResponse({
                        success: false,
                        error: error.message
                    });
                });


            // Keep message channel open
            return true;
        }


        // ------------------------------------------
        // UNKNOWN MESSAGE
        // ------------------------------------------

        console.warn(
            "Unknown message type:",
            message.type
        );

        sendResponse({
            success: false,
            error: "Unknown message type"
        });

        return false;
    }
);


// ==========================================
// SAVE STATE
// ==========================================

async function handleSaveState(tabState) {

    if (!tabState) {

        throw new Error(
            "Tab state is missing"
        );
    }


    const response =
        await fetch(
            BACKEND_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(tabState)
            }
        );


    if (!response.ok) {

        throw new Error(
            `Backend returned HTTP ${response.status}`
        );
    }


    return await response.json();
}


// ==========================================
// RESTORE STATE
// ==========================================

async function handleRestoreState(
    sessionId,
    url
) {

    if (!sessionId) {

        throw new Error(
            "Session ID is missing"
        );
    }


    if (!url) {

        throw new Error(
            "URL is missing"
        );
    }


    const requestUrl =
        `${BACKEND_URL}?sessionId=${encodeURIComponent(sessionId)}&url=${encodeURIComponent(url)}`;


    const response =
        await fetch(requestUrl);


    // ------------------------------------------
    // No saved state
    // ------------------------------------------

    if (response.status === 404) {

        return null;
    }


    // ------------------------------------------
    // Backend error
    // ------------------------------------------

    if (!response.ok) {

        throw new Error(
            `Backend returned HTTP ${response.status}`
        );
    }


    // ------------------------------------------
    // Saved state
    // ------------------------------------------

    return await response.json();
}


// ==========================================
// TAB DISCARD MONITORING
// ==========================================

chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab) => {

        if (
            changeInfo.discarded !== undefined
        ) {

            console.log(
                "TAB DISCARD STATUS CHANGED:",
                {
                    tabId: tabId,
                    discarded:
                        changeInfo.discarded,
                    url: tab.url
                }
            );
        }
    }
);