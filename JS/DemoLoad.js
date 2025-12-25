
document.addEventListener("DOMContentLoaded", () => {
    fetch("https://bed-seniorsync-assignment.onrender.com/health")
        .then(res => {
            console.log("SeniorSync Demo Loaded successfully", res);
        })
        .catch(err => {
            console.error("SeniorSync Demo failed loading", err);
        });

    console.log("SeniorSync - Demo load attempted");
});