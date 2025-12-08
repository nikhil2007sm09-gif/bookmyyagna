const API = "http://localhost:5000";

// ---------------------
// BOOK POOJA
// ---------------------
function bookPooja() {
    let userName = document.getElementById("poojaUser").value;
    let poojaType = document.getElementById("poojaType").value;

    if (!userName) return alert("Enter your name!");
    if (!poojaType) return alert("Select a pooja type!");

    fetch(`${API}/book-pooja`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName, poojaType })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("poojaMsg").innerText = data.msg;

        if (data.success) {
          
            if (!meetingId) {
    alert("Invalid Meeting! Go back to home page.");
    window.location.href = "meeting.html";
}

        }
    })
    .catch(err => console.log(err));
}

// ---------------------
// CREATE MEETING (Pandit)
// ---------------------
function createMeeting() {
    let trainerName = document.getElementById("trainerName").value;
    let meetingId = document.getElementById("meetingId").value;

    if (!trainerName) return alert("Enter Pandit Name!");

    fetch(`${API}/create-meeting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerName, meetingId })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("createMsg").innerText = data.msg;

        if (data.success) {
   
            setTimeout(() => {
                window.location.href = `meeting.html`;
            }, 1000);
        }
    })
    .catch(err => console.log(err));
}

// ---------------------
// JOIN MEETING (User)
// ---------------------
function joinMeeting() {
    let studentName = document.getElementById("studentName").value;
    let meetingId = document.getElementById("joinMeetingId").value;

    if (!studentName || !meetingId) return alert("Enter your name and Meeting ID!");

    fetch(`${API}/join-meeting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName, meetingId })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById("joinMsg").innerText = data.msg;

        if (data.success) {
            
if (!meetingId) {
    alert("Invalid Meeting! Go back to home page.");
    window.location.href = "meeting.html";
}

        }
    })
    .catch(err => console.log(err));
}
function bookPooja() {
    let pooja = document.getElementById("poojaType").value;
    let user = document.getElementById("poojaUser").value;

    if (user === "") {
        document.getElementById("poojaMsg").innerText = "❗ Please enter your name";
        return;
    }

    // Random Meeting ID generate
    let meetingId = "MT" + Math.floor(Math.random() * 9000 + 1000);

    // Success message
    document.getElementById("poojaMsg").innerText =
        `🎉 ${user}, your ${pooja} is booked! Meeting ID: ${meetingId}`;

    // Auto create + join meeting
    setTimeout(() => {
        window.location.href = `meeting.html?name=${user}&mid=${meetingId}`;
    }, 1000);
}

function createMeeting() {
    let trainer = document.getElementById("trainerName").value;
    let meetingId = document.getElementById("meetingId").value;

    if (trainer === "" || meetingId === "") {
        document.getElementById("createMsg").innerText = "❗ Enter all details";
        return;
    }

    document.getElementById("createMsg").innerText =
        `✔ Meeting Created: ${meetingId}`;
}

function joinMeeting() {
    let name = document.getElementById("studentName").value;
    let meetingId = document.getElementById("joinMeetingId").value;

    if (name === "" || meetingId === "") {
        document.getElementById("joinMsg").innerText = "❗ Enter all details";
        return;
    }

    window.location.href = `meeting.html?name=${name}&mid=${meetingId}`;
}
