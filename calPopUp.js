document.addEventListener('DOMContentLoaded', function() {
            // Create and append styles
            const style = document.createElement('style');
            style.textContent = `
            /* Styles for the blur background */
            .wv-blur-background {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background-color: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(1px); /* Subtle blur for the background */
                -webkit-backdrop-filter: blur(1px);
                z-index: 9; /* Should be less than modal's z-index */
                display: none;
            }
            .wv-blur-background.wv-show {
                display: block;
            }

            .wv-calendar-modal {
                position: fixed;
                display: none;
                background-color: rgba(30, 30, 30, 0.5); /* Semi-transparent dark background */
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                padding: 20px;
                width: 300px;
                opacity: 0;
                backdrop-filter: blur(50px); /* iOS-style background blur */
                -webkit-backdrop-filter: blur(50px);
                transition: opacity 0.3s ease;
                z-index: 10;
                box-sizing: border-box;
            }
            .wv-calendar-modal.wv-show {
                display: block;
                opacity: 1;
            }
            .wv-calendar-modal * {

            }
            /* Close button */
            .wv-calendar-close {
                position: absolute;
                right: 10px;
                top: 10px;
                color: #bbb; /* Light grey for visibility on dark background */
                font-size: 20px;
                font-weight: bold;
                cursor: pointer;
            }
            .wv-calendar-close:hover,
            .wv-calendar-close:focus {
                color: #fff;
            }

            /* Button styling */
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
                border: 1px solid #555; /* Dark border for subtle contrast */
                border-radius: 5px;
                text-decoration: none;
                color: #ddd; /* Light text color */
                font-weight: bold;
                cursor: pointer;
                transition: background 0.3s, transform 0.3s, box-shadow 0.3s;
            }
            .wv-calendar-button i {
                margin-right: 5px;
            }
            .wv-calendar-button:hover {
                background-color: rgba(70, 70, 70, 0.5); /* Slightly lighter background on hover */
                color: #f55555; /* Accent color for hover effect */
                transform: scale(1.05);
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            }

            /* Heading styling */
            .wv-calendar-modal h2 {
                color: #ddd;
                margin-top: 0;
                margin-bottom: 15px;
                font-size: 18px;
                font-weight: bold;
            }
                
                /* Mobile-specific styling */
                @media (max-width: 768px) {
                    .wv-calendar-modal {
                        width: 100%;
                        height: auto;
                        bottom: 0;
                        left: 0;
                        border-radius: 15px 15px 0 0;
                        box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
                        transition: transform 0.3s ease, opacity 0.3s ease;
                        transform: translateY(100%);
                        overflow-y: auto; /* In case content overflows */
                        z-index: 10;
                        box-sizing: border-box;
                    }
                    .wv-calendar-modal.wv-show {
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        
            // Create blur background
            const blurBackground = document.createElement('div');
            blurBackground.className = 'wv-blur-background';
            document.body.appendChild(blurBackground);
        
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
                    <a href="#" class="wv-calendar-button" id="wv-office365-link"><i class="fab fa-microsoft"></i> Office365</a>
                    <a href="#" class="wv-calendar-button" id="wv-ics-link"><i class="fas fa-calendar-alt"></i> ICS File</a>
                </div>
            `;
            document.body.appendChild(modal);
        
            // Helper functions and variables
            const generateUID = () => [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            const formatDateTime = (dateTime) => {
                const dt = new Date(dateTime);
                return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
            };
        
            const generateICSFile = (event) => {
                const { title, description, location, startTime, endTime } = event;
                const uid = generateUID();
                const formattedStartTime = formatDateTime(startTime);
                const formattedEndTime = formatDateTime(endTime);
                const formattedNow = formatDateTime(new Date());
                const escapedDescription = description.replace(/[\n\r]+/g, '\\n').replace(/[,;]/g, '\\$&');
                const escapedLocation = location.replace(/[,;]/g, '\\$&');
                const escapedTitle = title.replace(/[,;]/g, '\\$&');
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
        SUMMARY:${escapedTitle}
        END:VEVENT
        END:VCALENDAR`;
            };
        
            const generateCalendarUrls = (event) => {
                const { title, description, location, startTime, endTime } = event;
                const formattedTitle = encodeURIComponent(title);
                const formattedDescription = encodeURIComponent(description);
                const formattedLocation = encodeURIComponent(location);
        
                const formatGoogleDate = (dateTime) => formatDateTime(dateTime);
                const formatOutlookDate = (dateTime) => encodeURIComponent(new Date(dateTime).toISOString());
                const formatOffice365Date = (dateTime) => encodeURIComponent(new Date(dateTime).toISOString());
        
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
            let closeModalTimeout = null;
        
            const closeModal = () => {
                if (closeModalTimeout) {
                    clearTimeout(closeModalTimeout);
                    closeModalTimeout = null;
                }
        
                // Fade out the modal by removing the 'wv-show' class
                modal.classList.remove('wv-show');
                isModalOpen = false;
                lastClickedButton = null;
        
                // Hide the blur background
                blurBackground.classList.remove('wv-show');
            };
        
            // Now we can safely add event listeners
            blurBackground.addEventListener('click', closeModal);
            modal.querySelector('.wv-calendar-close').onclick = closeModal;
        
            const positionModal = () => {
                if (!lastClickedButton || !isModalOpen) return;
        
                // On mobile devices, no need to position the modal manually
                if (window.innerWidth <= 768) {
                    modal.style.left = `auto`;
                    modal.style.top = `auto`;
                    return;
                }
        
                const buttonRect = lastClickedButton.getBoundingClientRect();
                const modalRect = modal.getBoundingClientRect();
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
        
                let left, top;

                // Determine horizontal position
                if (buttonRect.right + modalRect.width <= viewportWidth) {
                    // Position modal's top right corner to button's bottom right corner
                    left = buttonRect.right - modalRect.width;
                } else if (buttonRect.left >= modalRect.width) {
                    // Not enough space on the right, align to button's bottom left corner
                    left = buttonRect.right - modalRect.width;
                } else {
                    // Center horizontally if no space on either side
                    left = Math.max((viewportWidth - modalRect.width) / 2, 10);
                }

                // Determine vertical position
                if (buttonRect.bottom + modalRect.height <= viewportHeight) {
                    // Position below the button
                    top = buttonRect.bottom + 10;
                } else if (buttonRect.top >= modalRect.height) {
                    // Not enough space below, position above the button
                    top = buttonRect.top - modalRect.height - 10;
                } else {
                    // Center vertically if no space above or below
                    top = Math.max((viewportHeight - modalRect.height) / 2, 10);
                }

                // Ensure the modal stays within the viewport
                left = Math.max(10, Math.min(left, viewportWidth - modalRect.width - 10));
                top = Math.max(10, Math.min(top, viewportHeight - modalRect.height - 10));

                // Set z-index based on the button
                const buttonZIndex = window.getComputedStyle(lastClickedButton).zIndex || 1;
                modal.style.zIndex = parseInt(buttonZIndex, 10) + 1;

                // Apply calculated position
                modal.style.left = `${left}px`;
                modal.style.top = `${top}px`;
            };
        
            const openModal = (button) => {
                lastClickedButton = button;
        
                // Show the modal and add 'wv-show' class
                modal.classList.add('wv-show');
        
                isModalOpen = true;
        
                // Show the blur background on mobile
                if (window.innerWidth <= 768) {
                    blurBackground.classList.add('wv-show');
                }
        
                // Position the modal
                positionModal();
        
                // Start the timeout to close the modal after 5 seconds
                closeModalTimeout = setTimeout(() => {
                    //closeModal();
                }, 5000);
            };
        
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
        
                    // Optionally, you can display an error message to the user
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
                } else if (!modal.contains(e.target) && isModalOpen && !blurBackground.contains(e.target)) {
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
        });
