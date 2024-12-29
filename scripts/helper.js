//helper.js
// SECTION 1: Screen Wake Lock Functionality
async function keepScreenAwake() {
    try {
        if ('wakeLock' in navigator) {
            const wakeLock = await navigator.wakeLock.request('screen');
            console.log('Screen wake lock is active.');

            document.addEventListener('visibilitychange', async () => {
                if (document.visibilityState === 'visible') {
                    await navigator.wakeLock.request('screen');
                    console.log('Screen wake lock restored.');
                } else {
                    wakeLock.release();
                    console.log('Screen wake lock released.');
                }
            });
        } else {
            console.warn('Wake Lock API is not supported on this browser.');
        }
    } catch (err) {
        console.error('Failed to acquire wake lock:', err);
    }
}

keepScreenAwake();