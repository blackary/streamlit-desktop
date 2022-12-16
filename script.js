const button = document.getElementById('logBtn');

button.addEventListener('click', (event) => {
    if (button.textContent =="Show Logs") {
        button.textContent = "Hide Logs";
    } else {
        button.textContent = "Show Logs"
    }
});