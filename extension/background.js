console.log("FreezeShield background service worker started!");


// ==========================================
// TAB DISCARD MONITORING
// ==========================================

chrome.tabs.onUpdated.addListener(
    (tabId, changeInfo, tab) => {

        if (changeInfo.discarded !== undefined) {

            console.log(
                "TAB DISCARD STATUS CHANGED:",
                {
                    tabId: tabId,
                    discarded: changeInfo.discarded,
                    url: tab.url
                }
            );
        }
    }
);