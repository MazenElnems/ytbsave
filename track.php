<?php
// Set headers to allow AJAX requests
header('Content-Type: application/json');

// Create directories if they don't exist
$dataDir = 'admin/data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Initialize files if they don't exist
$statsFile = "$dataDir/stats.json";
$downloadsFile = "$dataDir/downloads.json";

// Create stats.json if it doesn't exist
if (!file_exists($statsFile)) {
    $statsData = [
        'visits' => 0,
        'downloads' => 0,
        'last_updated' => date('Y-m-d H:i:s')
    ];
    file_put_contents($statsFile, json_encode($statsData, JSON_PRETTY_PRINT));
}

// Create downloads.json if it doesn't exist
if (!file_exists($downloadsFile)) {
    file_put_contents($downloadsFile, json_encode([], JSON_PRETTY_PRINT));
}

// Get the action from the request
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'visit':
        trackVisit();
        break;
        
    case 'download':
        trackDownload();
        break;
        
    default:
        echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
        exit;
}

/**
 * Track a page visit
 */
function trackVisit() {
    global $statsFile;
    
    // Load current stats
    $stats = json_decode(file_get_contents($statsFile), true);
    
    // Increment visit count
    $stats['visits']++;
    $stats['last_updated'] = date('Y-m-d H:i:s');
    
    // Save updated stats
    file_put_contents($statsFile, json_encode($stats, JSON_PRETTY_PRINT));
    
    // Return success
    echo json_encode(['status' => 'success', 'message' => 'Visit tracked']);
}

/**
 * Track a video download
 */
function trackDownload() {
    global $statsFile, $downloadsFile;
    
    // Get POST data
    $postData = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (empty($postData['title']) || empty($postData['url'])) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }
    
    // Load current stats
    $stats = json_decode(file_get_contents($statsFile), true);
    
    // Increment download count
    $stats['downloads']++;
    $stats['last_updated'] = date('Y-m-d H:i:s');
    
    // Save updated stats
    file_put_contents($statsFile, json_encode($stats, JSON_PRETTY_PRINT));
    
    // Load current downloads
    $downloads = json_decode(file_get_contents($downloadsFile), true);
    
    // Create download entry
    $downloadEntry = [
        'title' => $postData['title'],
        'url' => $postData['url'],
        'format' => $postData['format'] ?? 'Unknown',
        'timestamp' => $postData['timestamp'] ?? date('Y-m-d H:i:s')
    ];
    
    // Add new download entry to the beginning of the array
    array_unshift($downloads, $downloadEntry);
    
    // Limit to the latest 100 downloads
    if (count($downloads) > 100) {
        $downloads = array_slice($downloads, 0, 100);
    }
    
    // Save updated downloads
    file_put_contents($downloadsFile, json_encode($downloads, JSON_PRETTY_PRINT));
    
    // Return success
    echo json_encode(['status' => 'success', 'message' => 'Download tracked']);
} 