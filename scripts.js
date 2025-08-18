const url = 'https://script.google.com/macros/s/AKfycbzAJRlq1A3jnXdiyo5WrEnuKUDhveH8uUOCVXAtyGbZLryB3YE071Tcu1hpwJ-owGymeQ/exec';

function togglePassword() {
    var passwordInput = document.getElementById("password");
    var eyeIcon = document.getElementById("eyeIcon");

    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        eyeIcon.src = "https://img.icons8.com/ios-glyphs/30/000000/invisible.png"; // Change to 'eye closed' icon
    } else {
        passwordInput.type = "password";
        eyeIcon.src = "https://img.icons8.com/ios-glyphs/30/000000/visible.png"; // Change back to 'eye open' icon
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Add event listeners to each scroll button
    var buttons = document.getElementsByClassName('scroll-btn');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
            scrollToBottom(this.id);
        });
    }

    // Check if there is an active button stored in sessionStorage
    var activeButtonId = sessionStorage.getItem('activeButtonId');
    if (activeButtonId) {
        scrollToBottom(activeButtonId); // Activate the stored button
    } else {
        scrollToBottom('b1'); // Default to 'gi' button if no active button is stored
    }
});

function scrollToBottom(buttonId) {
    var buttons = document.getElementsByClassName('scroll-btn');
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
    }
    
    // Show/hide forms based on the button clicked
    var formIds = ['gi', 'ws', 'sd', 'swm', 'ut'];
    var headings = ['General Information', 'Water Supply', 'Sewerage and Drainage','Solid Waste Management', 'ULBs Undertaking']; // Update with your heading texts
    for (var i = 0; i < formIds.length; i++) {
        var form = document.getElementById(formIds[i]);
        if (buttonId === 'b' + (i + 1)) {
            form.style.display = 'block';
            var headingElement = document.getElementById('sheetN').querySelector('h2');
            headingElement.innerText = headings[i] + ': FY 2024-2025'; // Update heading text
            buttons[i].classList.add('active'); 
            sessionStorage.setItem('activeButtonId', buttonId); // Store the active button ID in sessionStorage
        } else {
            form.style.display = 'none';
        }
    }
}

let inactivityTimeout;
let logoutTimeout;



function login() {
    document.getElementById("password").type = "password";
    document.getElementById('errorMsg').style.display = 'none';
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('loader1').style.display = 'block';

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch(`${url}?action=verifyLogin&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`)
        .then(response => response.text())
        .then(text => {
            const trimmedText = text.trim();
            
            if (trimmedText.startsWith('success')) {
                // Extract state from the server response
                const state = trimmedText.split('state: ')[1].trim();
                
                // Save username and state to sessionStorage
                sessionStorage.setItem('username', username);
                sessionStorage.setItem('state', state);
                console.log('user:', username); 
                console.log('state:', state); 

                console.log('Successfully logged in');
                checkCitySubmission(username, state); 


            } else {
                document.getElementById('loader1').style.display = 'none';
                document.getElementById('login-btn').style.display = 'block';
                document.getElementById('errorMsg').textContent = 'Login failed! Please check your username and password.';
                document.getElementById('errorMsg').style.display = 'block';
                document.getElementById('login-btn').style.display = 'flex';
            }
        })
        .catch(error => {
            document.getElementById('loader1').style.display = 'none';
            console.error('Error:', error);
            document.getElementById('errorMsg').textContent = 'An error occurred during login. Please try again later.';
            document.getElementById('errorMsg').style.display = 'block';
            document.getElementById('login-btn').style.display = 'flex';
            // Reset username and password inputs
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        });
}


function checkCitySubmission(username, state) {
    username = username || sessionStorage.getItem('loggedInUsername');
    state = state || sessionStorage.getItem('loggedInState');

    if (!username) {
        console.error('Username is undefined and not available in session storage');
        return;
    }

    if (!state) {
        console.error('State is not available in session storage');
        return;
    }

    console.log('Checking submission for user:', username, 'in state:', state);

    fetch(`${url}?action=checkCitySubmission&username=${encodeURIComponent(username)}&state=${encodeURIComponent(state)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(message => {
            console.log('Response message:', message); // Log the response message #6AA84F

            document.getElementById('loader2').style.display = 'none';
            document.getElementById("result-popup").style.display = "none";

            if (message.startsWith('Submitted')) {
                document.getElementById('loader1').style.display = 'none';

                const [submissionInfo, ...urls] = message.split('URLs:');
                const [totalSubmissionsText, lastSubmissionInfo] = submissionInfo.split('Last submission on');
                const totalSubmissionsMatch = totalSubmissionsText.match(/\d+/);
                const totalSubmissions = totalSubmissionsMatch ? totalSubmissionsMatch[0] : '0';
                const lastTimestamp = lastSubmissionInfo.trim();

                sessionStorage.setItem('totalSubmissions', totalSubmissions);
                sessionStorage.setItem('lastTimestamp', lastTimestamp);
                sessionStorage.setItem('urls', urls.join(','));

                submittedDoc(username, state, totalSubmissions, lastTimestamp, urls.join(','));
            } else if (message === 'Remains') {
                showLoggedInState(username, state);
            } else {
                console.warn('Unexpected server response:', message);
            }
        })
        .catch(error => {
            console.error('Error:', error); // Log the entire error object
            const errorMsgElement = document.getElementById('errorMsg');
            errorMsgElement.textContent = 'An error occurred while checking city submission. Please try again later...!';
            errorMsgElement.style.display = 'block';
        });
}



function submittedDoc(username, state, totalSubmissions, lastTimestamp, urls) {
    // Retrieve values from session storage if not provided
    totalSubmissions = totalSubmissions || sessionStorage.getItem('totalSubmissions');
    lastTimestamp = lastTimestamp || sessionStorage.getItem('lastTimestamp');
    urls = urls || sessionStorage.getItem('urls');

    // Display the submitted section
    document.getElementById('filesSection').style.display = 'block';
    document.getElementById('dp-2').style.display = 'none';
    document.getElementById('loader1').style.display = 'none';
    document.getElementById('logout').style.display = 'flex';
    document.getElementById('dp-1').style.display = 'none';
    document.getElementById('login').style.display = 'none';
    document.getElementById('ulbDisplay').textContent = username;
    document.getElementById('ulbDisplay1').textContent = username;
    document.getElementById('state1').textContent = state;
    document.getElementById('submissionDetails').innerHTML = `Total Submissions Attempts: <strong>${totalSubmissions} times.</strong> <br>Last Submission: <strong>${lastTimestamp}</strong>`;

    // Function to transform Google Drive sharing link to direct download link
    function transformToExportLink(url) {
        const fileIdMatch = url.match(/\/d\/([^\/]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
            const fileId = fileIdMatch[1];
            return `https://drive.google.com/uc?export=download&id=${fileId}`;
        }
        return null; // Return null if no file ID is found
    }

    // Dynamically create and display the URL links in a table format
    const urlsContainer = document.getElementById('urlsContainer');
    urlsContainer.innerHTML = ''; // Clear any existing content

    // Create the table
    const table = document.createElement('table');

    // Create the table header
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Sr. No</th>
        <th>Document Name</th>
        <th>Download Link</th>
    `;
    table.appendChild(headerRow);

    // Loop through document names and URLs to create table rows
const urlArray = urls.split(','); // Convert comma-separated URLs to array
const numRows = Math.min(32, urlArray.length); // Adjust the number of rows based on available URLs

for (let i = 2; i <= numRows; i++) {
    const row = document.createElement('tr');

    // Serial Number
    const serialNumberCell = document.createElement('td');
    serialNumberCell.textContent = i-1;
    row.appendChild(serialNumberCell);

    // Document Name or "File is not attached"
    const docNameCell = document.createElement('td');
    const docName = urlArray[i] || ''; // Get the document name (adjusted index)
    if (docName) {
        docNameCell.textContent = docName;
    } else {
        docNameCell.innerHTML = '<span style="color: red;">Document name is not defined or file is not attached</span>'; // Red color for the message
    }
    row.appendChild(docNameCell);

    // Download Link or no link
    const urlCell = document.createElement('td');
    const urlIndex = i + 31; // Calculate the URL index

    if (urlIndex < urlArray.length && urlArray[urlIndex]) { // Ensure there is a corresponding URL
        const exportUrl = transformToExportLink(urlArray[urlIndex]); // Transform URL to export format
        if (exportUrl) {
            const downloadLink = document.createElement('a');
            downloadLink.href = exportUrl;
            downloadLink.textContent = 'Download file';
            downloadLink.target = '_blank'; // Opens in a new tab
            urlCell.appendChild(downloadLink);
        }
    } else {
        urlCell.innerHTML = '<span style="color: red;">File is not submitted</span>'; // Red color for the message
    }
    row.appendChild(urlCell);

    // Append the row to the table
    table.appendChild(row);
}

// Append the table to the container
urlsContainer.appendChild(table);

// Store username in session storage
sessionStorage.setItem('submittedUsername', username);
sessionStorage.setItem('submittedState', state);
}




  

function reSubmission() {
    const username = sessionStorage.getItem('submittedUsername'); // Get the username from session storage
    const state = sessionStorage.getItem('submittedState'); // Get the username from session storage
    if (username) {
        showLoggedInState(username,state);
    } else {
        console.error('No submitted username found');
        // Handle case where username is not available
    }
}

function flashDashboard() {
    var resultPopup = document.getElementById("result-popup");
    resultPopup.style.display = "flex";
    document.getElementById('loader2').style.display = 'block';

    checkCitySubmission(); // Call the function to check submission status
}


function logout() {
    sessionStorage.clear();
    showLoggedOutState();
}

function showLoggedInState(username, state) {
    console.log(`User ${username} is logged in`);
    console.log(`From ${state} is logged in`);
    sessionStorage.clear();
    document.getElementById('filesSection').style.display = 'none';
    document.getElementById('loader1').style.display = 'none';
    document.getElementById('logout').style.display = 'flex';
    document.getElementById('dp-1').style.display = 'none';
    document.getElementById('dp-2').style.display = 'block';
    document.getElementById('login').style.display = 'none';
    document.getElementById('ws').style.display = 'none';
    document.getElementById('sd').style.display = 'none';
    document.getElementById('swm').style.display = 'none';
    document.getElementById('ulbDisplay').textContent = username;
    document.getElementById('ulbDisplay2').textContent = username;
    document.getElementById('state').textContent = state;
    document.getElementById('state1').textContent = state;
    scrollToBottom('b1'); // Redirect to 'gi' button when user logs in
    startInactivityTimer();
    sessionStorage.setItem('loggedInUsername', username);
    sessionStorage.setItem('loggedInState', state);
}

function showLoggedOutState() {
    document.getElementById('filesSection').style.display = 'none';
    document.getElementById('dp-2').style.display = 'none';
    document.getElementById('dp-1').style.display = 'block';
    document.getElementById('login').style.display = 'flex';
    document.getElementById('logout').style.display = 'none';
    document.getElementById('login-btn').style.display = 'block';
    document.getElementById('loader1').style.display = 'none';
    clearTimeout(inactivityTimeout);
    clearTimeout(logoutTimeout);
    document.getElementById('custom-alert').style.display = 'none';
}

function checkUserState() {
    const submittedUsername = sessionStorage.getItem('submittedUsername');
    const loggedInUsername = sessionStorage.getItem('loggedInUsername');
    const submittedState = sessionStorage.getItem('submittedState');
    const loggedInState = sessionStorage.getItem('loggedInState');
    
    if (submittedUsername) {
        submittedDoc(submittedUsername,submittedState);
    } else if (loggedInUsername) {
        showLoggedInState(loggedInUsername,loggedInState);
    }
}

// Call the checkUserState function on page load
window.onload = function() {
    checkUserState();
};

function startInactivityTimer() {
    clearTimeout(inactivityTimeout);
    clearTimeout(logoutTimeout);

    inactivityTimeout = setTimeout(() => {
        document.getElementById('custom-alert').style.display = 'flex';
        logoutTimeout = setTimeout(() => {
            logout();
        }, 600000); 
    }, 660000); 
}

// Reset inactivity timer on user interaction
['click', 'mousemove', 'keypress'].forEach(event => {
    document.addEventListener(event, resetInactivityTimer);
});

function resetInactivityTimer() {
    console.log("Activity detected. Resetting inactivity timer.");
    clearTimeout(inactivityTimeout);
    clearTimeout(logoutTimeout);
    document.getElementById('custom-alert').style.display = 'none';
    startInactivityTimer();
}




function closePopup() {
    var popup = document.getElementById("success-popup");
    popup.style.display = "none";
}

function checkFile(input, errorId) {
    var file = input.files[0];
    var fileSize = file.size; // Size in bytes
    var maxSize = 2097152; // 2 MB in bytes

    if (fileSize > maxSize) {
        document.getElementById(errorId).style.display = "block";
        input.value = ''; // Reset file input
    } else {
        document.getElementById(errorId).style.display = "none";
    }
}

function giNextFileCheck(event) {
    event.preventDefault();
    if (q1.selectedIndex === 0 || q2.selectedIndex === 0 || q3.selectedIndex === 0) {
        alert("Please ensure that a document type is selected in each dropdown. Check where a selection is missing.");
        return; // Stop further execution
    }
    if (!fileInput1.files[0] || !fileInput2.files[0] || !fileInput3.files[0]) {
        alert("Please ensure that all required files are attached. Check where a file is missing.");
        return; // Stop further execution
    }
    document.getElementById('ws').style.display = 'block';
    var wsButton = document.getElementById('b2'); // Assuming the id of the button for "Water Supply" is 'b2'
    if (wsButton) {
        wsButton.click(); // Trigger the click event
    }
}

function wsNextFileCheck(event) {
    event.preventDefault();
    if (q4.selectedIndex === 0 || q5.selectedIndex === 0 || q6.selectedIndex === 0 || q7.selectedIndex === 0 || q8.selectedIndex === 0 || q9.selectedIndex === 0 || q10.selectedIndex === 0 || q11.selectedIndex === 0 || q12.selectedIndex === 0) {
        alert("Please ensure that a document type is selected in each dropdown. Check where a selection is missing.");
        return; // Stop further execution
    }
    if (!fileInput4.files[0] || !fileInput5.files[0] || !fileInput6.files[0] || !fileInput7.files[0] || !fileInput8.files[0] || !fileInput9.files[0] || !fileInput10.files[0] || !fileInput11.files[0] || !fileInput12.files[0]) {
        alert("Please ensure that all required files are attached. Check where a file is missing.");
        return; // Stop further execution
    }
    document.getElementById('sd').style.display = 'block';
    var sdButton = document.getElementById('b3'); // Assuming the id of the button for "sd" is 'b3'
    if (sdButton) {
        sdButton.click(); // Trigger the click event
    }
}

function sdNextFileCheck(event) {
    event.preventDefault();
    if (q13.selectedIndex === 0 || q14.selectedIndex === 0 || q15.selectedIndex === 0 || q16.selectedIndex === 0 || q17.selectedIndex === 0 || q18.selectedIndex === 0 || q19.selectedIndex === 0 || q20.selectedIndex === 0 || q21.selectedIndex === 0) {
        alert("Please ensure that a document type is selected in each dropdown. Check where a selection is missing.");
        return; // Stop further execution
    }
    if (!fileInput13.files[0] || !fileInput14.files[0] || !fileInput15.files[0] || !fileInput16.files[0] || !fileInput17.files[0] || !fileInput18.files[0] || !fileInput19.files[0] || !fileInput20.files[0] || !fileInput21.files[0]) {
        alert("Please ensure that all required files are attached. Check where a file is missing.");
        return; // Stop further execution
    }
    document.getElementById('swm').style.display = 'block';
    var sdButton = document.getElementById('b4'); // Assuming the id of the button for "swm" is 'b4'
    if (sdButton) {
        sdButton.click(); // Trigger the click event
    }
}

function swmNextFileCheck(event) {
    event.preventDefault();
    if (q22.selectedIndex === 0 || q23.selectedIndex === 0 || q24.selectedIndex === 0 || q25.selectedIndex === 0 || q26.selectedIndex === 0 || q27.selectedIndex === 0 || q28.selectedIndex === 0 || q29.selectedIndex === 0) {
        alert("Please ensure that a document type is selected in each dropdown. Check where a selection is missing.");
        return; // Stop further execution
    }
    if (!fileInput22.files[0] || !fileInput23.files[0] || !fileInput24.files[0] || !fileInput25.files[0] || !fileInput26.files[0] || !fileInput27.files[0] || !fileInput28.files[0] || !fileInput29.files[0]) {
        alert("Please ensure that all required files are attached. Check where a file is missing.");
        return; // Stop further execution
    }
    document.getElementById('ut').style.display = 'block';
    var sdButton = document.getElementById('b5'); // Assuming the id of the button for "ut" is 'b4'
    if (sdButton) {
        sdButton.click(); // Trigger the click event
    }
}

function captureAndSendFormData(url) {
    var formData = new FormData();
    
    // Get the file input elements
    var fileInputs = [
        document.getElementById("fileInput1"),
        document.getElementById("fileInput2"),
        document.getElementById("fileInput3"),
        document.getElementById("fileInput4"),
        document.getElementById("fileInput5"),
        document.getElementById("fileInput6"),
        document.getElementById("fileInput7"),
        document.getElementById("fileInput8"),
        document.getElementById("fileInput9"),
        document.getElementById("fileInput10"),
        document.getElementById("fileInput11"),
        document.getElementById("fileInput12"),
        document.getElementById("fileInput13"),
        document.getElementById("fileInput14"),
        document.getElementById("fileInput15"),
        document.getElementById("fileInput16"),
        document.getElementById("fileInput17"),
        document.getElementById("fileInput18"),
        document.getElementById("fileInput19"),
        document.getElementById("fileInput20"),
        document.getElementById("fileInput21"),
        document.getElementById("fileInput22"),
        document.getElementById("fileInput23"),
        document.getElementById("fileInput24"),
        document.getElementById("fileInput25"),
        document.getElementById("fileInput26"),
        document.getElementById("fileInput27"),
        document.getElementById("fileInput28"),
        document.getElementById("fileInput29"),
        document.getElementById("fileInput30"),
        document.getElementById("fileInput31")
    ];
    
    // Get the selected files
    var files = fileInputs.map(input => input.files[0]);

    // Add other form data to FormData object
    formData.append("ulb", document.getElementById("ulbDisplay").textContent);
    formData.append("state", document.getElementById("state").textContent);
    formData.append("q1", document.getElementById("q1").value);
    formData.append("q2", document.getElementById("q2").value);
    formData.append("q3", document.getElementById("q3").value);
    formData.append("q4", document.getElementById("q4").value);
    formData.append("q5", document.getElementById("q5").value);
    formData.append("q6", document.getElementById("q6").value);
    formData.append("q7", document.getElementById("q7").value);
    formData.append("q8", document.getElementById("q8").value);
    formData.append("q9", document.getElementById("q9").value);
    formData.append("q10", document.getElementById("q10").value);
    formData.append("q10", document.getElementById("q10").value);
    formData.append("q11", document.getElementById("q11").value);
    formData.append("q12", document.getElementById("q12").value);
    formData.append("q13", document.getElementById("q13").value);
    formData.append("q14", document.getElementById("q14").value);
    formData.append("q15", document.getElementById("q15").value);
    formData.append("q16", document.getElementById("q16").value);
    formData.append("q17", document.getElementById("q17").value);
    formData.append("q18", document.getElementById("q18").value);
    formData.append("q19", document.getElementById("q19").value);
    formData.append("q20", document.getElementById("q20").value);
    formData.append("q21", document.getElementById("q21").value);
    formData.append("q22", document.getElementById("q22").value);
    formData.append("q23", document.getElementById("q23").value);
    formData.append("q24", document.getElementById("q24").value);
    formData.append("q25", document.getElementById("q25").value);
    formData.append("q26", document.getElementById("q26").value);
    formData.append("q27", document.getElementById("q27").value);
    formData.append("q28", document.getElementById("q28").value);
    formData.append("q29", document.getElementById("q29").value);
    formData.append("q30", document.getElementById("q30").value);
    formData.append("q31", document.getElementById("q31").value);


    // Function to handle the form submission after reading all files
    function sendFormData() {
        // Prepare and send the form data
        var button = document.getElementById("submit");
        var submittingPopup = document.getElementById('submitting-popup');
        submittingPopup.style.display = "flex";
        document.getElementById('loader').style.display = 'block';
        button.classList.add("gray-button");

        fetch(url, {
            method: "POST",
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            console.log(data);
            submittingPopup.style.display = "none";
            var successPopup = document.getElementById("success-popup");
            successPopup.style.display = "flex";
            // Reset form
            const forms = document.querySelectorAll("form");
            forms.forEach(form => form.reset());
            button.classList.remove("gray-button");
           
        })
        .catch(error => {
            console.error('Error:', error);
            alert("An error occurred while submitting data (SendFormData). Please try again later.");
            submittingPopup.style.display = "none";
            button.classList.remove("gray-button");
        });
    }

    // Function to read files using FileReader
    function readFilesAndAppendToFormData(index = 0) {
        if (index < files.length) {
            let file = files[index];
            if (file) {
                let reader = new FileReader();
                reader.onload = function(e) {
                    formData.append("file" + (index + 1), e.target.result);
                    readFilesAndAppendToFormData(index + 1); // Read the next file
                };
                reader.onerror = function(e) {
                    // Customize alert messages based on the file index
                    let fileAlertMessage = "File reader error.";
                    if (index >= 0 && index <= 2) { // GI attachments (fileInput1 to fileInput3)
                        fileAlertMessage = "Error with General Information" + (index + 1) + " attachment.";
                    } else if (index >= 3 && index <= 11) { // WS attachments (fileInput4 to fileInput12)
                        fileAlertMessage = "Error with Water Supply" + (index - 2) + " attachment.";
                    } else if (index >= 12 && index <= 20) { // SWM attachments (fileInput13 to fileInput21)
                        fileAlertMessage = "Error with Sewerage and Drainage" + (index - 11) + " attachment.";
                    } else if (index >= 21 && index <= 28) { // SWM sheet attachments (fileInput22 to fileInput29)
                        fileAlertMessage = "Error with Solid Waste Management" + (index - 20) + " attachment.";
                    } else if (index >= 29 && index <= 30) { // ULB attachments (fileInput30 to fileInput31)
                        fileAlertMessage = "Error with ULBs Undertaking" + (index - 28) + " attachment.";
                    }

                    console.error('File read error:', e);
                    alert(fileAlertMessage + " Please try again.");

                    // Scroll to the problematic file input element
                    fileInputs[index].scrollIntoView({ behavior: "smooth", block: "center" });
                    fileInputs[index].focus(); // Optionally, focus on the input

                    return;
                };
                reader.readAsDataURL(file);
            } else {
                readFilesAndAppendToFormData(index + 1); // Skip to the next file if current file input is empty
            }
        } else {
            sendFormData(); // All files have been read, now send the form data
        }
    }

    readFilesAndAppendToFormData(); // Start reading files
}

// Attach the event listener to the submit button
document.getElementById("submit").addEventListener("click", function(event) {
    event.preventDefault();  // Prevent the default form submission
    captureAndSendFormData(url);
});

