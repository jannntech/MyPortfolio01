let reconnectModal;
let retryButton;
let resumeButton;
let visibilityHandlerAttached = false;

// This runs when the module is loaded
export function initialize() {
    reconnectModal = document.getElementById("components-reconnect-modal");
    retryButton = document.getElementById("components-reconnect-button");
    resumeButton = document.getElementById("components-resume-button");

    if (!reconnectModal) return;

    // جلوگیری از ثبت چندباره event
    reconnectModal.removeEventListener("components-reconnect-state-changed", handleReconnectStateChanged);
    reconnectModal.addEventListener("components-reconnect-state-changed", handleReconnectStateChanged);

    if (retryButton) {
        retryButton.removeEventListener("click", retry);
        retryButton.addEventListener("click", retry);
    }

    if (resumeButton) {
        resumeButton.removeEventListener("click", resume);
        resumeButton.addEventListener("click", resume);
    }
}

function handleReconnectStateChanged(event) {
    const state = event?.detail?.state;

    switch (state) {
        case "show":
            reconnectModal?.showModal();
            break;

        case "hide":
            reconnectModal?.close();
            break;

        case "failed":
            if (!visibilityHandlerAttached) {
                document.addEventListener("visibilitychange", retryWhenVisible);
                visibilityHandlerAttached = true;
            }
            break;

        case "rejected":
            location.reload();
            break;

        default:
            console.warn("Unknown reconnect state:", state);
            break;
    }
}

async function retry() {
    removeVisibilityHandler();

    try {
        const successful = await Blazor.reconnect();

        if (!successful) {
            const resumeSuccessful = await Blazor.resumeCircuit();

            if (!resumeSuccessful) {
                location.reload();
            } else {
                reconnectModal?.close();
            }
        }
    } catch (err) {
        console.error("Reconnect failed:", err);
        addVisibilityHandler();
    }
}

async function resume() {
    try {
        const successful = await Blazor.resumeCircuit();

        if (!successful) {
            location.reload();
        }
    } catch (err) {
        console.error("Resume failed:", err);

        reconnectModal?.classList.remove("components-reconnect-paused");
        reconnectModal?.classList.add("components-reconnect-resume-failed");
    }
}

async function retryWhenVisible() {
    if (document.visibilityState === "visible") {
        await retry();
    }
}

// Helpers
function addVisibilityHandler() {
    if (!visibilityHandlerAttached) {
        document.addEventListener("visibilitychange", retryWhenVisible);
        visibilityHandlerAttached = true;
    }
}

function removeVisibilityHandler() {
    if (visibilityHandlerAttached) {
        document.removeEventListener("visibilitychange", retryWhenVisible);
        visibilityHandlerAttached = false;
    }
}