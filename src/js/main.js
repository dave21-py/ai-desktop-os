/* ================================================= */
/* AI OS - Homepage Animation Script                 */
/* ================================================= */

// This event listener waits for the entire HTML document to be loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {
    
    // Select the UI elements we want to animate.
    const background = document.querySelector('.background-image');
    const topDock = document.querySelector('.top-dock');
    const bottomBar = document.querySelector('.bottom-bar');

    // We use a series of staggered timeouts to create a smooth, sequential animation.
    // This feels more polished than everything appearing at once.

    // Step 1: Fade in the background image.
    // A small delay (100ms) ensures the browser is ready.
    setTimeout(() => {
        background.classList.add('loaded');
    }, 100);

    // Step 2: Slide down the top dock.
    // This happens 300ms after the background starts animating.
    setTimeout(() => {
        topDock.classList.add('loaded');
    }, 400);

    // Step 3: Slide up the bottom bar.
    // This happens 200ms after the top dock starts animating.
    setTimeout(() => {
        bottomBar.classList.add('loaded');
    }, 600);

});