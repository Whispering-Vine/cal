<html>
<body>
<script>
(function() {
    // Create and append styles
    const style = document.createElement('style');
    style.textContent = `
        .wv-calendar-modal {
            position: fixed;
            display: none;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            padding: 20px;
            width: 300px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .wv-calendar-modal.wv-show {
            opacity: 1;
        }
        .wv-calendar-modal * {
            font-family: Arial, sans-serif;
        }
        .wv-calendar-close {
            position: absolute;
            right: 10px;
            top: 10px;
            color: #aaa;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
        }
        .wv-calendar-close:hover,
        .wv-calendar-close:focus {
            color: #333;
        }
        .wv-calendar-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 15px;
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
        }
        .wv-calendar-button:hover {
            background-color: #f0f0f0;
            color: #f55555;
            transform: scale(1.05);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .wv-calendar-modal h2 {
            color: #333;
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
        }
    `;
    document.head.appendChild(style);

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'wv-calendar-modal';
    modal.innerHTML = `
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

    let lastClickedButton = null;
    let isModalOpen = false;

    const positionModal = () => {
        if (!lastClickedButton || !isModalOpen) return;

        const buttonRect = lastClickedButton.getBoundingClientRect();
        const modalRect = modal.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left, top;

        // Determine horizontal position
        if (viewportWidth - buttonRect.right >= modalRect.width) {
            // Position to the right
            left = buttonRect.left;
        } else if (buttonRect.left >= modalRect.width) {
            // Position to the left
            left = buttonRect.right - modalRect.width;
        } else {
            // Center horizontally if no space on either side
            left = (viewportWidth - modalRect.width) / 2;
        }

        // Determine vertical position
        if (viewportHeight - buttonRect.bottom >= modalRect.height) {
            // Position below the button
            top = buttonRect.bottom;
        } else if (buttonRect.top >= modalRect.height) {
            // Position above the button
            top = buttonRect.top - modalRect.height;
        } else {
            // Center vertically if no space above or below
            top = (viewportHeight - modalRect.height) / 2;
        }

        // Adjust horizontal position based on vertical position
        if (top === buttonRect.bottom) {
            // If below the button
            left = (left === buttonRect.left) ? buttonRect.left : buttonRect.right - modalRect.width;
        } else if (top === buttonRect.top - modalRect.height) {
            // If above the button
            left = (left === buttonRect.left) ? buttonRect.left : buttonRect.right - modalRect.width;
        }

        // Ensure the modal stays within the viewport
        left = Math.max(10, Math.min(left, viewportWidth - modalRect.width - 10));
        top = Math.max(10, Math.min(top, viewportHeight - modalRect.height - 10));

        // Set z-index based on the button
        const buttonZIndex = window.getComputedStyle(lastClickedButton).zIndex || 1;
        modal.style.zIndex = parseInt(buttonZIndex, 10) + 1;

        modal.style.left = `${left}px`;
        modal.style.top = `${top}px`;
    };

    const openModal = (button) => {
        lastClickedButton = button;
        
        // Make the modal visible but still transparent
        modal.style.display = 'block';
        modal.style.opacity = '0';
        
        // Force a reflow to ensure the modal is in the DOM
        modal.offsetHeight;
        
        // Position the modal
        positionModal();
        
        // Fade in the modal
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
            modal.classList.add('wv-show');
        });
        
        isModalOpen = true;
    };

    const closeModal = () => {
        modal.classList.remove('wv-show');
        setTimeout(() => {
            modal.style.display = 'none';
            isModalOpen = false;
            lastClickedButton = null;
        }, 300);
    };

    modal.querySelector('.wv-calendar-close').onclick = closeModal;

    // Fetch event details and generate links
    const fetchEventDetailsAndGenerateLinks = async (eventId, button) => {
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

            openModal(button);
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
                e.preventDefault();
                fetchEventDetailsAndGenerateLinks(eventId, button);
            }
        } else if (!modal.contains(e.target) && isModalOpen) {
            closeModal();
        }
    });

    // Handle window resize, scroll, and zoom
    const updateModalPosition = () => {
        if (isModalOpen) {
            positionModal();
        }
    };

    window.addEventListener('resize', updateModalPosition);

    document.addEventListener('scroll', () => {
    if (!isModalOpen) return;

    const buttonRect = lastClickedButton.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    if (buttonRect.bottom < 0 || buttonRect.top > viewportHeight) {
        closeModal();
    }
});
    window.addEventListener('wheel', updateModalPosition);  // For zoom events on desktop
    window.addEventListener('touchmove', updateModalPosition);  // For mobile scrolling and pinch-zoom

    // Use MutationObserver to detect changes in the DOM that might affect positioning
    const observer = new MutationObserver(updateModalPosition);
    observer.observe(document.body, { 
        attributes: true, 
        childList: true, 
        subtree: true 
    });

    // Load Font Awesome
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
    document.head.appendChild(link);
})();
</script>

<button data-event-id="jXncpE">
    <i class="fas fa-calendar-plus"></i> Add to Calendar
</button>
</body>
</html>
