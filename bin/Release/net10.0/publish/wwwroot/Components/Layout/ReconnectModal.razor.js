let reconnectModal;
let retryButton;
let resumeButton;

// This runs when the module is loaded
export function initialize() {
    reconnectModal = document.getElementById("components-reconnect-modal");
    retryButton = document.getElementById("components-reconnect-button");
    resumeButton = document.getElementById("components-resume-button");

    if (!reconnectModal) return;

    reconnectModal.addEventListener("components-reconnect-state-changed", handleReconnectStateChanged);

    if (retryButton) {
        retryButton.addEventListener("click", retry);
    }

    if (resumeButton) {
        resumeButton.addEventListener("click", resume);
    }
}

function handleReconnectStateChanged(event) {
    if (event.detail.state === "show") {
        reconnectModal.showModal();
    } 
    else if (event.detail.state === "hide") {
        reconnectModal.close();
    } 
    else if (event.detail.state === "failed") {
        document.addEventListener("visibilitychange", retryWhenVisible);
    } 
    else if (event.detail.state === "rejected") {
        location.reload();
    }
}

async function retry() {
    document.removeEventListener("visibilitychange", retryWhenVisible);

    try {
        const successful = await Blazor.reconnect();

        if (!successful) {
            const resumeSuccessful = await Blazor.resumeCircuit();

            if (!resumeSuccessful) {
                location.reload();
            } else {
                reconnectModal.close();
            }
        }
    } catch {
        document.addEventListener("visibilitychange", retryWhenVisible);
    }
}

async function resume() {
    try {
        const successful = await Blazor.resumeCircuit();

        if (!successful) {
            location.reload();
        }
    } catch {
        reconnectModal.classList.replace(
            "components-reconnect-paused",
            "components-reconnect-resume-failed"
        );
    }
}

async function retryWhenVisible() {
    if (document.visibilityState === "visible") {
        await retry();
    }
}