/*******************************
 * Configuration for Colors
 *******************************/
const formatColors = {
    greenFormats: ["17", "18", "22"],
    blueFormats: ["139", "140", "141", "249", "250", "251", "599", "600"],
    defaultColor: "#9e0cf2"
};

/*******************************
 * Utility Functions
 *******************************/

/**
 * Get the background color based on the format itag.
 * @param {string} downloadUrlItag - The itag parameter from the download URL.
 * @returns {string} - The corresponding background color.
 */
function getBackgroundColor(downloadUrlItag) {
    if (formatColors.greenFormats.includes(downloadUrlItag)) {
        return "green";
    } else if (formatColors.blueFormats.includes(downloadUrlItag)) {
        return "#3800ff";
    } else {
        return formatColors.defaultColor;
    }
}

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Extract YouTube video ID from a given URL.
 * @param {string} url - The YouTube URL.
 * @returns {string|null} - The video ID or null if not found.
 */
// Function to get YouTube video IDs from a URL, including Shorts URLs
function getYouTubeVideoIds(url) {
    // Validate the input
    if (!url || typeof url !== 'string') {
        console.error('Invalid URL provided to getYouTubeVideoId:', url);
        return null;
    }

    try {
        // Create a URL object to parse the URL
        const urlObj = new URL(url);

        // Check if the hostname belongs to YouTube or YouTube short links
        const validHosts = ['www.youtube.com', 'youtube.com', 'youtu.be'];
        if (!validHosts.includes(urlObj.hostname)) {
            console.warn('URL does not belong to YouTube:', url);
            return null;
        }

        // For youtu.be (short link), the video ID is in the pathname
        if (urlObj.hostname === 'youtu.be') {
            const videoId = urlObj.pathname.slice(1); // Remove the leading '/'
            return videoId.length === 11 ? videoId : null;
        }

        // For youtube.com URLs, look for 'v' or 'shorts' in query or pathname
        if (urlObj.hostname.includes('youtube.com')) {
            if (urlObj.pathname.startsWith('/shorts/')) {
                // Shorts video ID is in the pathname after "/shorts/"
                return urlObj.pathname.split('/')[2];
            }

            // Regular video URLs have 'v' as a query parameter
            const videoId = urlObj.searchParams.get('v');
            return videoId && videoId.length === 11 ? videoId : null;
        }

        console.warn('Unrecognized YouTube URL format:', url);
        return null;
    } catch (error) {
        console.error('Error parsing URL in getYouTubeVideoId:', error);
        return null;
    }
}



/**
 * Sanitize HTML content using DOMPurify.
 * @param {string} content - The HTML content to sanitize.
 * @returns {string} - The sanitized HTML.
 */
function sanitizeContent(content) {
    return DOMPurify.sanitize(content);
}

/**
 * Update the inner HTML of a specified element with sanitized content.
 * @param {string} elementId - The ID of the HTML element.
 * @param {string} content - The content to inject.
 */
function updateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = content;
    } else {
        console.warn(`Element with ID "${elementId}" not found.`);
    }
}

/**
 * Retrieve a query parameter value by name from a URL.
 * @param {string} name - The name of the parameter.
 * @param {string} url - The URL to extract the parameter from.
 * @returns {string} - The parameter value or an empty string if not found.
 */
function getParameterByName(name, url) {
    // Properly escape regex special characters
    name = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    
    if (!results) return '';
    if (!results[2]) return '';
    
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/*******************************
 * AJAX Request with Retry Logic
 *******************************/

/**
 * Make an AJAX GET request with retry capability.
 * @param {string} inputUrl - The input URL for the request.
 * @param {number} retries - Number of retry attempts remaining.
 */
function makeRequest(inputUrl, retries = 4) {
    const requestUrl = `https://vkrdownloader.xyz/server?api_key=vkrdownloader&vkr=${encodeURIComponent(inputUrl)}`;
    const retryDelay = 2000; // Initial retry delay in milliseconds
    const maxRetries = retries;

    $.ajax({
        url: requestUrl,
        type: "GET",
        cache: true,
        async: true,
        crossDomain: true,
        dataType: 'json',
        timeout: 15000, // Extended timeout for slower networks
        success: function (data) {
            handleSuccessResponse(data, inputUrl);
        },
        error: function (xhr, status, error) {
            if (retries > 0) {
                let delay = retryDelay * Math.pow(2, maxRetries - retries); // Exponential backoff
                console.log(`Retrying in ${delay / 1000} seconds... (${retries} attempts left)`);
                setTimeout(() => makeRequest(inputUrl, retries - 1), delay);
            } else {
                const errorMessage = getErrorMessage(xhr, status, error);
                console.error(`Error Details: ${errorMessage}`);
                displayError("Unable to fetch the download link after several attempts. Please check the URL or try again later.");
                document.getElementById("loading").style.display = "none";
            }
        },
        complete: function () {
            document.getElementById("downloadBtn").disabled = false; // Re-enable the button
        }
    });
}

function getErrorMessage(xhr, status, error) {
    const statusCode = xhr.status;
    let message = `Status: ${status}, Error: ${error}`;

    if (xhr.responseText) {
        try {
            const response = JSON.parse(xhr.responseText);
            if (response && response.error) {
                message += `, Server Error: ${response.error}`;
            }
        } catch (e) {
            message += `, Unable to parse server response.`;
        }
    }

    switch (statusCode) {
        case 0: return "Network Error: The server is unreachable.";
        case 400: return "Bad Request: The input URL might be incorrect.";
        case 401: return "Unauthorized: Please check the API key.";
        case 429: return "Too Many Requests: You are being rate-limited.";
        case 503: return "Service Unavailable: The server is temporarily overloaded.";
        default: return `${message}, HTTP ${statusCode}: ${xhr.statusText || error}`;
    }
}


function displayError(message) {
    const errorElement = document.getElementById("errorMessage");
    if (errorElement) {
        errorElement.innerText = message;
        errorElement.style.display = "block";
        errorElement.classList.add('animate__animated', 'animate__shakeX');
        
        // Hide loading
        document.getElementById("loading").style.display = "none";
        
        // Re-enable the download button
        document.getElementById("downloadBtn").disabled = false;
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorElement.classList.remove('animate__shakeX');
            errorElement.classList.add('animate__fadeOut');
            
            // Reset classes and hide after animation completes
            setTimeout(() => {
                errorElement.style.display = "none";
                errorElement.classList.remove('animate__animated', 'animate__fadeOut');
            }, 1000);
        }, 5000);
    } else {
        // Fallback to console error if the error element doesn't exist
        console.error("Error:", message);
    }
}

/**
 * Generate a detailed error message based on the XHR response.
 * @param {Object} xhr - The XMLHttpRequest object.
 * @param {string} status - The status string.
 * @param {string} error - The error message.
 * @returns {string} - The formatted error message.
 */

/*******************************
 * Event Handlers
 *******************************/

/**
 * Handle the "Download" button click event.
 */
document.getElementById("downloadBtn").addEventListener("click", debounce(function () {
    document.getElementById("loading").style.display = 'block'; // Show loading animation
    document.getElementById("downloadBtn").disabled = true; // Disable the button

    const inputUrl = document.getElementById("inputUrl").value.trim();
    if (!inputUrl) {
        displayError("Please enter a valid YouTube URL.");
        document.getElementById("loading").style.display = "none";
        document.getElementById("downloadBtn").disabled = false;
        return;
    }

    makeRequest(inputUrl); // Make the AJAX request with retry logic
}, 300));  // Adjust the delay as needed

/**
 * Display an error message within the page instead of using alert.
 * @param {string} message - The error message to display.
 */
function displayError(message) {
    const errorElement = document.getElementById("errorMessage");
    if (errorElement) {
        errorElement.innerText = message;
        errorElement.style.display = "block";
        errorElement.classList.add('animate__animated', 'animate__shakeX');
        
        // Hide loading
        document.getElementById("loading").style.display = "none";
        
        // Re-enable the download button
        document.getElementById("downloadBtn").disabled = false;
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorElement.classList.remove('animate__shakeX');
            errorElement.classList.add('animate__fadeOut');
            
            // Reset classes and hide after animation completes
            setTimeout(() => {
                errorElement.style.display = "none";
                errorElement.classList.remove('animate__animated', 'animate__fadeOut');
            }, 1000);
        }, 5000);
    } else {
        // Fallback to console error if the error element doesn't exist
        console.error("Error:", message);
    }
}

/*******************************
 * Response Handlers
 *******************************/

/**
 * Handle successful AJAX responses.
 * @param {Object} data - The response data from the server.
 * @param {string} inputUrl - The original input URL.
 */
function handleSuccessResponse(data, inputUrl) {
    document.getElementById("loading").style.display = "none";

    if (data.data) {
        const videoData = data.data;
        
        // Show results container with enhanced animation
        const container = document.getElementById("container");
        container.style.display = "block";
        container.classList.add('animate__animated', 'animate__fadeIn');
        container.style.animationDuration = '0.6s';
        
        // Add subtle entrance animations to elements inside the container
        const elements = container.querySelectorAll('.row, .download-options');
        elements.forEach((element, index) => {
            element.classList.add('animate__animated', 'animate__fadeInUp');
            element.style.animationDelay = `${0.2 * (index + 1)}s`;
            element.style.animationDuration = '0.5s';
        });
        
        // Extract necessary data
        const videoSource = videoData.source;
        const videoId = getYouTubeVideoIds(videoSource);
        const thumbnailUrl = videoId 
            ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
            : videoData.thumbnail;
        
        // Set thumbnail with enhanced fade-in effect
        const thumbElement = document.getElementById("thumb");
        if (thumbElement) {
            // Create responsive thumbnail
            const img = document.createElement("img");
            img.src = thumbnailUrl;
            img.alt = videoData.title || "Video Thumbnail";
            img.classList.add('animate__animated', 'animate__fadeIn');
            img.style.animationDuration = '1s';
            thumbElement.innerHTML = '';
            thumbElement.appendChild(img);
        }
        
        // Set title with proper formatting and animation
        if (videoData.title) {
            const titleElement = document.getElementById("title");
            titleElement.innerHTML = `<h2>${sanitizeContent(videoData.title)}</h2>`;
            titleElement.classList.add('animate__animated', 'animate__fadeInUp');
            titleElement.style.animationDelay = '0.3s';
        }
        
        // Set description with truncation if too long
        if (videoData.description) {
            let description = videoData.description;
            if (description.length > 300) {
                description = description.substring(0, 300) + '...';
            }
            const descElement = document.getElementById("description");
            descElement.innerHTML = `<p>${sanitizeContent(description)}</p>`;
            descElement.classList.add('animate__animated', 'animate__fadeInUp');
            descElement.style.animationDelay = '0.4s';
        }
        
        // Set video metadata with animation
        const metaElements = ["uploader", "duration", "extractor"];
        metaElements.forEach((id, index) => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('animate__animated', 'animate__fadeInUp');
                element.style.animationDelay = `${0.5 + (index * 0.1)}s`;
            }
        });
        
        updateElement("uploader", videoData.uploader ? `<p><strong>Uploader:</strong> ${sanitizeContent(videoData.uploader)}</p>` : "");
        updateElement("duration", videoData.size ? `<p><strong>Size:</strong> ${sanitizeContent(videoData.size)}</p>` : "");
        updateElement("extractor", videoData.extractor ? `<p><strong>Source:</strong> ${sanitizeContent(videoData.extractor)}</p>` : videoSource ? `<p><strong>Source:</strong> ${sanitizeContent(videoSource)}</p>` : "");

        // Generate download buttons
        generateDownloadButtons(data, inputUrl);
    } else {
        displayError("Issue: Unable to retrieve the download link. Please check the URL and try again later.");
    }
}

/**
 * Add this function to create a ripple effect when clicking buttons
 */
function createRipple(event) {
    const button = event.currentTarget;
    
    // Remove any existing ripple
    const ripple = button.querySelector('.ripple');
    if (ripple) {
        ripple.remove();
    }
    
    // Create new ripple element
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;
    
    // Set ripple position based on click coordinates
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - button.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${event.clientY - button.getBoundingClientRect().top - radius}px`;
    circle.classList.add('ripple');
    
    // Add ripple to button
    button.appendChild(circle);
    
    // Remove ripple after animation completes
    setTimeout(() => {
        if (circle && circle.parentNode === button) {
            circle.remove();
        }
    }, 600);
}

/**
 * Modify the button creation in generateDownloadButtons to add the ripple effect
 */
function generateDownloadButtons(videoData, inputUrl) {
    const downloadContainer = document.getElementById("download");
    if (!downloadContainer) return;
    
    // Clear existing content
    downloadContainer.innerHTML = "";

    if (videoData.data) {
        const downloads = videoData.data.downloads || [];
        const videoSource = videoData.data.source;
        const videoId = getYouTubeVideoIds(videoSource);
        
        // Handle YouTube videos with special formatting and staggered animations
        if (videoId) {
            const qualities = [
                { quality: "mp3", label: "MP3 Audio", icon: "fas fa-music", color: "#3800ff" },
                { quality: "360", label: "360p", icon: "fas fa-video", color: "#9e0cf2" },
                { quality: "720", label: "720p HD", icon: "fas fa-film", color: "green" },
                { quality: "1080", label: "1080p Full HD", icon: "fas fa-film", color: "#9e0cf2" }
            ];
            
            // Add buttons with staggered animation
            qualities.forEach((item, index) => {
                setTimeout(() => {
                    const button = document.createElement("button");
                    button.className = "dlbtns animate__animated animate__fadeInUp";
                    button.style.backgroundColor = item.color;
                    button.style.animationDelay = `${index * 0.15}s`;
                    
                    // Add icon
                    const icon = document.createElement("i");
                    icon.className = item.icon;
                    button.appendChild(icon);
                    button.appendChild(document.createTextNode(" " + item.label));
                    
                    // Add ripple effect
                    button.addEventListener('mousedown', createRipple);
                    
                    // Add click event
                    button.addEventListener("click", function(event) {
                        // Prevent multiple clicks
                        if (button.classList.contains('downloading')) return;
                        
                        // Show loading animation
                        button.classList.add("downloading");
                        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
                        
                        // Get the download URL
                        const downloadUrl = `https://vkrdownloader.xyz/server/dlbtn.php?q=${encodeURIComponent(item.quality)}&vkr=${encodeURIComponent(videoSource)}`;
                        
                        // Get the video title from the page
                        const titleElement = document.getElementById('title');
                        let videoTitle = 'download';
                        if (titleElement && titleElement.querySelector('h2')) {
                            videoTitle = titleElement.querySelector('h2').textContent.trim();
                        }
                        
                        // Start the progress-based download
                        fetchMediaWithProgress(
                            downloadUrl,
                            videoTitle,
                            item.quality,
                            (url, blob) => {
                                // Download completed successfully
                                console.log('Download completed');
                                
                                // Reset the button after a delay
                                setTimeout(() => {
                                    button.classList.remove("downloading");
                                    button.innerHTML = `<i class="${item.icon}"></i> ${item.label}`;
                                }, 1000);
                            },
                            (percent) => {
                                // Progress update
                                if (percent === 50) {
                                    // Update button at 50% for visual feedback
                                    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${percent}%`;
                                }
                            },
                            (error) => {
                                // Error occurred
                                console.error('Download error:', error);
                                
                                // Reset the button to error state
                                button.classList.remove("downloading");
                                button.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error`;
                                
                                setTimeout(() => {
                                    button.innerHTML = `<i class="${item.icon}"></i> ${item.label}`;
                                }, 3000);
                            }
                        );
                    });
                    
                    downloadContainer.appendChild(button);
                }, 50); // Reduced from 100ms to 50ms for a faster sequence
            });
        } else {
            // Non-YouTube videos - process all available downloads
            let uniqueFormats = new Map(); // Use Map to track unique formats by quality
            
            // First pass: categorize and filter formats
            downloads.forEach(download => {
                if (download && download.url) {
                    const downloadUrl = download.url;
                    const formatId = download.format_id || "";
                    const videoExt = download.format_id || "Unknown";
                    const videoSize = download.size || "";
                    const quality = download.height ? `${download.height}p` : 
                                  (videoExt.includes("audio") || videoExt.includes("mp3")) ? "Audio" : "Unknown";
                    
                    // Skip duplicates, favor higher quality
                    if (!uniqueFormats.has(quality) || 
                        (download.filesize && uniqueFormats.get(quality).filesize < download.filesize)) {
                        uniqueFormats.set(quality, {
                            url: downloadUrl,
                            format_id: formatId,
                            label: `${quality} ${videoSize ? `(${videoSize})` : ""}`,
                            isAudio: !download.height
                        });
                    }
                }
            });
            
            // Second pass: create buttons with staggered animations
            let index = 0;
            uniqueFormats.forEach((format, quality) => {
                setTimeout(() => {
                    const button = document.createElement("button");
                    button.className = "dlbtns animate__animated animate__fadeInUp";
                    button.style.backgroundColor = getBackgroundColor(format.format_id);
                    button.style.animationDelay = `${index * 0.15}s`;
                    
                    // Set appropriate icon
                    let iconClass = "fas fa-download";
                    if (format.isAudio) {
                        iconClass = "fas fa-music";
                    } else if (quality.includes("720") || quality.includes("1080")) {
                        iconClass = "fas fa-film";
                    } else if (quality.includes("p")) {
                        iconClass = "fas fa-video";
                    }
                    
                    // Add icon and label
                    const icon = document.createElement("i");
                    icon.className = iconClass;
                    button.appendChild(icon);
                    button.appendChild(document.createTextNode(" " + format.label));
                    
                    // Add ripple effect
                    button.addEventListener('mousedown', createRipple);
                    
                    // Add click event
                    button.addEventListener("click", function(event) {
                        // Prevent multiple clicks
                        if (button.classList.contains('downloading')) return;
                        
                        // Show loading animation
                        button.classList.add("downloading");
                        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
                        
                        // Get the download URL
                        const downloadUrl = format.url;
                        
                        // Get the video title from the page
                        const titleElement = document.getElementById('title');
                        let videoTitle = 'download';
                        if (titleElement && titleElement.querySelector('h2')) {
                            videoTitle = titleElement.querySelector('h2').textContent.trim();
                        }
                        
                        // Start the progress-based download
                        fetchMediaWithProgress(
                            downloadUrl,
                            videoTitle,
                            quality,
                            (url, blob) => {
                                // Download completed successfully
                                console.log('Download completed');
                                
                                // Reset the button after a delay
                                setTimeout(() => {
                                    button.classList.remove("downloading");
                                    button.innerHTML = `<i class="${iconClass}"></i> ${format.label}`;
                                }, 1000);
                            },
                            (percent) => {
                                // Progress update
                                if (percent === 50) {
                                    // Update button at 50% for visual feedback
                                    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${percent}%`;
                                }
                            },
                            (error) => {
                                // Error occurred
                                console.error('Download error:', error);
                                
                                // Reset the button to error state
                                button.classList.remove("downloading");
                                button.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error`;
                                
                                setTimeout(() => {
                                    button.innerHTML = `<i class="${iconClass}"></i> ${format.label}`;
                                }, 3000);
                            }
                        );
                    });
                    
                    downloadContainer.appendChild(button);
                }, 50 * index); // Faster staggered timing
                index++;
            });
        }
    } else {
        displayError("No download links found or data structure is incorrect.");
    }

    // If no download buttons were added, notify the user
    setTimeout(() => {
        if (downloadContainer.innerHTML.trim() === "") {
            displayError("Couldn't find any download options. Please try a different video URL.");
            document.getElementById("container").style.display = "none";
        }
    }, 500);
}

/*******************************
 * UI Enhancement Functions
 *******************************/

/**
 * Initialize UI enhancements after the DOM is fully loaded
 */
$(document).ready(function() {
    // Initialize back to top button
    initBackToTop();
    
    // Initialize form submission handlers
    initContactForm();
    
    // Add scroll event for navbar
    initScrollEffects();
});

/**
 * Initialize back to top button functionality
 */
function initBackToTop() {
    const backToTopButton = document.getElementById('backToTop');
    
    if (backToTopButton) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        });
        
        // Scroll to top when button is clicked
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

/**
 * Initialize scroll effects (navbar changes on scroll)
 */
function initScrollEffects() {
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

/**
 * Initialize contact form submission
 */
function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simple form validation
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            if (!name || !email || !message) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Here you would normally send the form data to the server
            // For now, we'll just show a success message
            
            // Reset form
            contactForm.reset();
            
            // Show success message
            if (formSuccess) {
                formSuccess.style.display = 'block';
                
                // Hide success message after 5 seconds
                setTimeout(function() {
                    formSuccess.style.display = 'none';
                }, 5000);
            }
        });
    }
}

/**
 * Format duration in seconds to readable time
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration string
 */
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return "Unknown";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let formattedTime = "";
    if (hours > 0) {
        formattedTime += hours + "h ";
    }
    if (minutes > 0 || hours > 0) {
        formattedTime += minutes + "m ";
    }
    formattedTime += secs + "s";
    
    return formattedTime;
}

/**
 * Create a download button with enhanced styling and animation
 * @param {Object} format - The format object from the API
 * @param {string} inputUrl - The input URL
 * @param {string} label - Button label
 * @param {string} iconClass - Font Awesome icon class
 * @returns {HTMLElement} - The created button
 */
function createDownloadButton(format, inputUrl, label, iconClass) {
    const button = document.createElement("button");
    button.className = "dlbtns animate__animated animate__fadeInUp";
    button.style.backgroundColor = getBackgroundColor(format.format_id);
    
    // Add icon
    const icon = document.createElement("i");
    icon.className = iconClass || "fas fa-download";
    button.appendChild(icon);
    
    // Add space between icon and text
    button.appendChild(document.createTextNode(" "));
    
    // Add button text
    button.appendChild(document.createTextNode(label));
    
    // Add download URL and attributes
    if (format.url) {
        button.addEventListener("click", function() {
            // Add loading effect to button
            button.classList.add("downloading");
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing...';
            
            // Simulate processing delay
            setTimeout(function() {
                // Restore button text but with success icon
                button.classList.remove("downloading");
                button.innerHTML = `<i class="fas fa-check-circle"></i> ${label}`;
                
                // Open download in new tab/window
                window.open(format.url, "_blank");
                
                // Restore original button after a delay
                setTimeout(function() {
                    button.innerHTML = `<i class="${iconClass}"></i> ${label}`;
                }, 3000);
            }, 800);
        });
    }
    
    return button;
}

/**
 * Track a download in the backend
 * @param {string} title - The video title
 * @param {string} url - The video URL
 * @param {string} format - The format type (mp3, video quality, etc.)
 */
function trackDownload(title, url, format) {
    fetch('track.php?action=download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            title: title,
            url: url,
            format: format,
            timestamp: new Date().toISOString()
        })
    })
    .then(response => response.json())
    .catch(error => console.error('Error tracking download:', error));
}

/**
 * Fetch and download media with progress tracking
 * @param {string} url - The download URL
 * @param {string} title - The title to display
 * @param {string} format - The format type (mp3, video, etc.)
 * @param {Function} onComplete - Callback when download is complete
 * @param {Function} onProgress - Callback for progress updates
 * @param {Function} onError - Callback for errors
 */
function fetchMediaWithProgress(url, title, format, onComplete, onProgress, onError) {
    // Show progress container
    const progressContainer = document.getElementById('downloadProgress');
    const progressBar = document.getElementById('progressBar');
    const downloadStatus = document.getElementById('downloadStatus');
    const downloadTitle = document.getElementById('downloadTitle');
    const directDownloadLink = document.getElementById('directDownloadLink');
    const cancelDownloadBtn = document.getElementById('cancelDownload');
    
    // Set initial states
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressBar.setAttribute('aria-valuenow', '0');
    downloadStatus.textContent = 'Preparing download...';
    downloadTitle.textContent = `Downloading: ${title} (${format})`;
    directDownloadLink.style.display = 'none';
    
    // Create an AbortController to allow canceling the fetch
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Set up cancel button
    cancelDownloadBtn.onclick = function() {
        controller.abort();
        downloadStatus.textContent = 'Download canceled';
        progressContainer.classList.add('animate__animated', 'animate__fadeOut');
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressContainer.classList.remove('animate__animated', 'animate__fadeOut');
        }, 1000);
    };
    
    // Make the fetch request
    fetch(url, { signal })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Get content length for progress calculation
            const contentLength = response.headers.get('content-length');
            const total = contentLength ? parseInt(contentLength, 10) : 0;
            let loaded = 0;
            
            // Create a reader to read the response body in chunks
            const reader = response.body.getReader();
            const chunks = [];
            
            // Function to process chunks and update progress
            function processChunks() {
                return reader.read().then(({ done, value }) => {
                    if (done) {
                        // All chunks have been read
                        return new Blob(chunks);
                    }
                    
                    // Add the chunk to our array
                    chunks.push(value);
                    
                    // Update progress if content length is available
                    if (total) {
                        loaded += value.length;
                        const percent = Math.round((loaded / total) * 100);
                        progressBar.style.width = `${percent}%`;
                        progressBar.setAttribute('aria-valuenow', percent);
                        downloadStatus.textContent = `Downloaded ${formatBytes(loaded)} of ${formatBytes(total)} (${percent}%)`;
                        
                        // Call progress callback
                        if (onProgress) onProgress(percent, loaded, total);
                    } else {
                        // If content length is not available, show indeterminate progress
                        downloadStatus.textContent = `Downloaded ${formatBytes(loaded)} (size unknown)`;
                    }
                    
                    // Continue reading
                    return processChunks();
                });
            }
            
            // Start processing chunks
            return processChunks();
        })
        .then(blob => {
            // Create object URL and update download link
            const url = URL.createObjectURL(blob);
            directDownloadLink.href = url;
            
            // Add filename to download attribute (use title or fallback)
            const filename = sanitizeFilename(title) + (format === 'mp3' ? '.mp3' : '.mp4');
            directDownloadLink.download = filename;
            directDownloadLink.style.display = 'inline-block';
            
            // Update status
            downloadStatus.textContent = 'Download ready!';
            progressBar.style.width = '100%';
            progressBar.setAttribute('aria-valuenow', '100');
            
            // Track the download
            const videoUrl = document.getElementById("inputUrl").value.trim();
            trackDownload(title, videoUrl, format);
            
            // Call complete callback
            if (onComplete) onComplete(url, blob);
        })
        .catch(error => {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted');
            } else {
                console.error('Download error:', error);
                downloadStatus.textContent = `Error: ${error.message}`;
                progressBar.classList.add('bg-danger');
                
                // Call error callback
                if (onError) onError(error);
            }
        });
}

/**
 * Format bytes as human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Sanitize filename for safe download
 * @param {string} name - Original filename
 * @returns {string} - Sanitized filename
 */
function sanitizeFilename(name) {
    // Remove invalid characters and trim
    return name.replace(/[/\\?%*:|"<>]/g, '_').trim();
}
