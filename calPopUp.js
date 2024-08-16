(function() {
    // Create and append styles
    const style = document.createElement('style');
    style.textContent = `
        .wv-calendar-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
        }
        .wv-calendar-modal * {
            font-family: Arial, sans-serif;
        }
        .wv-calendar-modal-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 30px;
            border: 1px solid #888;
            width: 80%;
            max-width: 600px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            position: relative;
            animation-name: wvModalopen;
            animation-duration: 0.4s;
        }
        @keyframes wvModalopen {
            from {opacity: 0}
            to {opacity: 1}
        }
        .wv-calendar-close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }
        .wv-calendar-close:hover,
        .wv-calendar-close:focus {
            color: black;
            text-decoration: none;
        }
        .wv-calendar-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 20px;
        }
        .wv-calendar-button {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 5px;
            text-decoration: none;
            color: #333;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s, transform 0.3s, box-shadow 0.3s;
        }
        .wv-calendar-button i {
            margin-right: 5px;
            margin-bottom: 2px;
        }
        .wv-calendar-button:hover {
            background-color: #f0f0f0;
            color: #f55555;
            transform: scale(1.05);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        .wv-calendar-modal h2 {
            color: #333;
            margin-top: 0;
        }
    `;
    document.head.appendChild(style);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'wv-calendar-modal';
    modal.innerHTML = `
        <div class="wv-calendar-modal-content">
            <span class="wv-calendar-close">&times;</span>
            <h2>Select Calendar</h2>
            <div class="wv-calendar-buttons">
                <a href="#" class="wv-calendar-button" id="wv-google-link"><i class="fab fa-google"></i> Google</a>
                <a href="#" class="wv-calendar-button" id="wv-apple-link"><i class="fab fa-apple"></i> Apple</a>
                <a href="#" class="wv-calendar-button" id="wv-outlook-link"><i class="fas fa-envelope"></i> Outlook</a>
                <a href="#" class="wv-calendar-button" id="wv-yahoo-link"><i class="fab fa-yahoo"></i> Yahoo</a>
                <a href="#" class="wv-calendar-button" id="wv-office365-link"><i class="fas fa-envelope"></i> Office 365</a>
                <a href="#" class="wv-calendar-button" id="wv-ics-link"><i class="fas fa-file-alt"></i> ICS File</a>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Helper functions
    const generateUID = () => [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const formatDateTime = (dateTime) => new Date(dateTime).toISOString().replace(/[-:]/g, '').slice(0, -5) + 'Z';

    const generateICSFile = (event) => {
        const { title, description, location, startTime, endTime } = event;
        const uid = generateUID();
        const formattedStartTime = formatDateTime(startTime);
        const formattedEndTime = formatDateTime(endTime);
        const formattedNow = formatDateTime(new Date().toISOString());
        const escapedDescription = description.replace(/[\n\r]+/g, '\\n').replace(/[,;]/g, '\\$&');
        const escapedLocation = location.replace(/[,;]/g, '\\$&');
        return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:Whispering Vine
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formattedNow}
DTSTART:${formattedStartTime}
DTEND:${formattedEndTime}
DESCRIPTION:${escapedDescription}
LOCATION:${escapedLocation}
SUMMARY:${title}
END:VEVENT
END:VCALENDAR`;
    };

    const generateCalendarUrls = (event) => {
        const { title, description, location, startTime, endTime } = event;
        const formattedTitle = encodeURIComponent(title);
        const formattedDescription = encodeURIComponent(description);
        const formattedLocation = encodeURIComponent(location);

        const formatGoogleDate = (dateTime) => formatDateTime(dateTime);
        const formatOutlookDate = (dateTime) => new Date(dateTime).toISOString().replace(/:/g, '%3a');
        const formatOffice365Date = (dateTime) => new Date(dateTime).toISOString();

        const startDateGoogle = formatGoogleDate(startTime);
        const endDateGoogle = formatGoogleDate(endTime);
        const startDateOutlook = formatOutlookDate(startTime);
        const endDateOutlook = formatOutlookDate(endTime);
        const startDateOffice365 = formatOffice365Date(startTime);
        const endDateOffice365 = formatOffice365Date(endTime);

        return {
            google: `https://calendar.google.com/calendar/r/eventedit?text=${formattedTitle}&dates=${startDateGoogle}/${endDateGoogle}&details=${formattedDescription}&location=${formattedLocation}`,
            yahoo: `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${formattedTitle}&st=${startDateGoogle}&et=${endDateGoogle}&desc=${formattedDescription}&in_loc=${formattedLocation}`,
            outlook: `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&startdt=${startDateOutlook}&enddt=${endDateOutlook}&subject=${formattedTitle}&body=${formattedDescription}&location=${formattedLocation}`,
            office365: `https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&startdt=${startDateOffice365}&enddt=${endDateOffice365}&subject=${formattedTitle}&body=${formattedDescription}&location=${formattedLocation}`
        };
    };

    // Modal functionality
    const openModal = () => modal.style.display = "block";
    const closeModal = () => modal.style.display = "none";
    modal.querySelector('.wv-calendar-close').onclick = closeModal;
    window.onclick = (event) => {
        if (event.target == modal) closeModal();
    };

    // Fetch event details and generate links
    const fetchEventDetailsAndGenerateLinks = async (eventId) => {
        try {
            const response = await fetch(`https://raw.githubusercontent.com/Whispering-Vine/cal/main/events/${eventId}.json`);
            if (!response.ok) throw new Error('Event not found');
            const event = await response.json();

            const urls = generateCalendarUrls(event);
            document.getElementById('wv-google-link').href = urls.google;
            document.getElementById('wv-yahoo-link').href = urls.yahoo;
            document.getElementById('wv-outlook-link').href = urls.outlook;
            document.getElementById('wv-office365-link').href = urls.office365;

            const icsContent = generateICSFile(event);
            const blob = new Blob([icsContent], { type: 'text/calendar' });
            const icsBlobUrl = URL.createObjectURL(blob);
            const icsLink = document.getElementById('wv-ics-link');
            icsLink.href = icsBlobUrl;
            icsLink.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

            document.getElementById('wv-apple-link').onclick = (e) => {
                e.preventDefault();
                window.location.href = `https://cal.wvwine.co/events/${eventId}.ics`;
            };

            openModal();
        } catch (error) {
            console.error('Error fetching event data:', error);
        }
    };

    // Attach click event to all buttons with data-event-id
    document.addEventListener('click', (e) => {
        const button = e.target.closest('[data-event-id]');
        if (button) {
            const eventId = button.dataset.eventId;
            if (eventId) {
                fetchEventDetailsAndGenerateLinks(eventId);
            }
        }
    });

    // Load Font Awesome
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
    document.head.appendChild(link);
})();
