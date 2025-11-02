// flash-message.test.js

// Mock setTimeout and clearTimeout for predictable test results
const originalSetTimeout = window.setTimeout;
const originalClearTimeout = window.clearTimeout;
let timers = {};
let timerId = 0;

window.setTimeout = (callback, delay) => {
    const id = ++timerId;
    timers[id] = { callback, delay, called: false };
    return id;
};

window.clearTimeout = (id) => {
    delete timers[id];
};

// Helper to run all pending timers
const runAllTimers = () => {
    for (const id in timers) {
        if (timers[id] && !timers[id].called) {
            timers[id].callback();
            timers[id].called = true;
        }
    }
};

// Reset mocks after each test
const resetMocks = () => {
    timers = {};
    timerId = 0;
    document.body.innerHTML = ''; // Clean up DOM
};

// Simple assertion library
const assert = {
    equal: (actual, expected, message) => {
        if (actual === expected) {
            console.log(`%c✓ ${message}`, 'color: green');
        } else {
            console.error(`%c✗ ${message}: Expected ${expected}, got ${actual}`, 'color: red');
        }
    },
    ok: (value, message) => {
        if (value) {
            console.log(`%c✓ ${message}`, 'color: green');
        } else {
            console.error(`%c✗ ${message}: Expected truthy, got ${value}`, 'color: red');
        }
    },
    notOk: (value, message) => {
        if (!value) {
            console.log(`%c✓ ${message}`, 'color: green');
        } else {
            console.error(`%c✗ ${message}: Expected falsy, got ${value}`, 'color: red');
        }
    },
    contains: (haystack, needle, message) => {
        if (haystack.includes(needle)) {
            console.log(`%c✓ ${message}`, 'color: green');
        } else {
            console.error(`%c✗ ${message}: Expected "${haystack}" to contain "${needle}"`, 'color: red');
        }
    }
};

// Test Suite for FlashMessage
console.log('%cRunning FlashMessage Tests...', 'font-weight: bold;');

// Test 1: Message container is created and appended to body
(() => {
    resetMocks();
    const flash = new FlashMessage();
    assert.ok(document.getElementById('flash-message-container'), 'Test 1: Message container exists');
    assert.equal(document.body.children[0].id, 'flash-message-container', 'Test 1: Message container is first child of body');
})();

// Test 2: showFlashMessage displays a message with default type 'info'
(() => {
    resetMocks();
    const flash = new FlashMessage();
    flash.show('Hello World');
    const msgElement = document.querySelector('.flash-message');
    assert.ok(msgElement, 'Test 2: Message element is created');
    assert.contains(msgElement.textContent, 'Hello World', 'Test 2: Message text is correct');
    assert.ok(msgElement.classList.contains('flash-message-info'), 'Test 2: Default type is info');
})();

// Test 3: showFlashMessage displays a message with specified type 'success'
(() => {
    resetMocks();
    const flash = new FlashMessage();
    flash.show('Success!', 'success');
    const msgElement = document.querySelector('.flash-message');
    assert.ok(msgElement.classList.contains('flash-message-success'), 'Test 3: Type is success');
})();

// Test 4: Message auto-dismisses after duration
(() => {
    resetMocks();
    const flash = new FlashMessage();
    flash.show('Auto dismiss', 'info', 100);
    let msgElement = document.querySelector('.flash-message');
    assert.ok(msgElement, 'Test 4: Message exists before dismiss');

    runAllTimers(); // Simulate time passing

    // After animation, element should be removed. We need to mock animationend for a full test.
    // For now, we check if dismissing class is added.
    msgElement = document.querySelector('.flash-message');
    assert.ok(msgElement.classList.contains('dismissing'), 'Test 4: Message has dismissing class after timeout');
})();

// Test 5: Message dismisses on close button click
(() => {
    resetMocks();
    const flash = new FlashMessage();
    flash.show('Click to dismiss');
    const msgElement = document.querySelector('.flash-message');
    const closeButton = msgElement.querySelector('.close-button');

    assert.ok(msgElement, 'Test 5: Message exists before click');
    closeButton.click();
    assert.ok(msgElement.classList.contains('dismissing'), 'Test 5: Message has dismissing class after close click');
})();

// Test 6: Multiple messages can be displayed
(() => {
    resetMocks();
    const flash = new FlashMessage();
    flash.show('First message');
    flash.show('Second message', 'error');
    const messages = document.querySelectorAll('.flash-message');
    assert.equal(messages.length, 2, 'Test 6: Two messages are displayed');
    assert.contains(messages[0].textContent, 'First message', 'Test 6: First message text correct');
    assert.contains(messages[1].textContent, 'Second message', 'Test 6: Second message text correct');
})();

// Restore original setTimeout and clearTimeout
window.setTimeout = originalSetTimeout;
window.clearTimeout = originalClearTimeout;

console.log('%cFlashMessage Tests Finished.', 'font-weight: bold;');
