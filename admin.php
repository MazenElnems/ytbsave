<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    header('Location: login.php');
    exit;
}

// Define admin data directory
$dataDir = 'admin/data';
$statsFile = "$dataDir/stats.json";
$downloadsFile = "$dataDir/downloads.json";

// Load stats data
$stats = file_exists($statsFile) 
    ? json_decode(file_get_contents($statsFile), true) 
    : ['visits' => 0, 'downloads' => 0, 'last_updated' => date('Y-m-d H:i:s')];

// Load downloads data
$downloads = file_exists($downloadsFile)
    ? json_decode(file_get_contents($downloadsFile), true)
    : [];

// Get only the latest 5 downloads
$recentDownloads = array_slice($downloads, 0, 5);

// Format timestamp function
function formatTimestamp($timestamp) {
    $date = new DateTime($timestamp);
    return $date->format('M d, Y h:i A');
}

// Format large numbers
function formatNumber($number) {
    if ($number >= 1000000) {
        return round($number / 1000000, 1) . 'M';
    } elseif ($number >= 1000) {
        return round($number / 1000, 1) . 'K';
    }
    return $number;
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Ytbsave</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
    <link rel="stylesheet" type="text/css" href="style.css">
    <link rel="icon" href="/Ytbsave/logo.png" sizes="32x32" type="image/png">
    <style>
        body {
            min-height: 100vh;
            padding-top: 90px;
            padding-bottom: 2rem;
        }
        
        .admin-navbar {
            background-color: rgba(0, 0, 0, 0.8) !important;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
        }
        
        .dashboard-container {
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(5px);
            margin-bottom: 2rem;
        }
        
        .stats-card {
            background: linear-gradient(135deg, #4361ee, #3a56d4);
            border-radius: 15px;
            padding: 1.5rem;
            color: white;
            height: 100%;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(67, 97, 238, 0.3);
        }
        
        .stats-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(67, 97, 238, 0.4);
        }
        
        .stats-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }
        
        .stats-number {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .stats-label {
            font-size: 1rem;
            opacity: 0.8;
        }
        
        .download-table {
            background-color: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
        }
        
        .download-table th {
            background-color: var(--primary-color);
            color: white;
            font-weight: 600;
            padding: 1rem;
        }
        
        .download-table td {
            padding: 1rem;
            vertical-align: middle;
        }
        
        .download-table tr:nth-child(odd) {
            background-color: rgba(67, 97, 238, 0.05);
        }
        
        .download-title {
            font-weight: 600;
            color: var(--text-color);
            max-width: 300px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .download-url {
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--primary-color);
        }
        
        .download-url a {
            color: var(--primary-color);
            text-decoration: none;
            transition: color 0.2s ease;
            display: block;
            max-width: 100%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .download-url a:hover {
            color: var(--primary-dark);
            text-decoration: underline;
        }
        
        .download-time {
            color: #6c757d;
            font-size: 0.9rem;
        }
        
        .format-badge {
            background-color: var(--primary-color);
            color: white;
            padding: 0.3rem 0.7rem;
            border-radius: 30px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .logout-btn {
            background-color: var(--danger-color);
            border: none;
            transition: all 0.3s ease;
        }
        
        .logout-btn:hover {
            background-color: #c0392b;
            transform: translateY(-2px);
        }
        
        .back-btn {
            background-color: var(--secondary-color);
            border: none;
            transition: all 0.3s ease;
        }
        
        .back-btn:hover {
            background-color: #e74c3c;
            transform: translateY(-2px);
        }
        
        .section-title {
            margin-bottom: 2rem;
        }
        
        .section-title h2 {
            position: relative;
            display: inline-block;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--primary-color);
        }
        
        .section-title h2::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            width: 50px;
            height: 3px;
            background-color: var(--primary-color);
            transform: translateX(-50%);
        }
        
        .username-display {
            font-weight: 600;
            color: var(--light-text);
        }
        
        @media (max-width: 768px) {
            .stats-card {
                margin-bottom: 1.5rem;
            }
            
            .download-table {
                font-size: 0.9rem;
            }
            
            .download-title {
                max-width: 200px;
            }
            
            .download-url {
                max-width: 120px;
            }
        }
    </style>
</head>

<body>
    <!-- Admin Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark fixed-top admin-navbar">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="index.html">
                <img src="logo.png" alt="Ytbsave Logo" class="me-2">
                <span>Ytbsave Admin</span>
            </a>
            <div class="ms-auto d-flex align-items-center">
                <span class="text-light me-3 username-display">
                    <i class="fas fa-user-circle me-1"></i> <?php echo htmlspecialchars($_SESSION['admin_username']); ?>
                </span>
                <a href="logout.php" class="btn btn-sm btn-danger logout-btn">
                    <i class="fas fa-sign-out-alt me-1"></i> Logout
                </a>
            </div>
        </div>
    </nav>

    <!-- Dashboard Content -->
    <div class="container">
        <!-- Stats Overview -->
        <div class="dashboard-container animate__animated animate__fadeIn">
            <div class="row">
                <div class="col-md-6 col-lg-6 mb-4 mb-lg-0">
                    <div class="stats-card">
                        <div class="stats-icon">
                            <i class="fas fa-eye"></i>
                        </div>
                        <div class="stats-number"><?php echo formatNumber($stats['visits']); ?></div>
                        <div class="stats-label">Total Visits</div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-6">
                    <div class="stats-card">
                        <div class="stats-icon">
                            <i class="fas fa-download"></i>
                        </div>
                        <div class="stats-number"><?php echo formatNumber($stats['downloads']); ?></div>
                        <div class="stats-label">Total Downloads</div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Recent Downloads -->
        <div class="dashboard-container animate__animated animate__fadeIn" style="animation-delay: 0.2s;">
            <div class="section-title text-center">
                <h2>Recent Downloads</h2>
            </div>
            
            <?php if (empty($recentDownloads)): ?>
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle me-2"></i> No downloads recorded yet.
                </div>
            <?php else: ?>
                <div class="download-table table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>URL</th>
                                <th>Format</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($recentDownloads as $download): ?>
                                <tr>
                                    <td title="<?php echo htmlspecialchars($download['title']); ?>">
                                        <div class="download-title"><?php echo htmlspecialchars($download['title']); ?></div>
                                    </td>
                                    <td title="<?php echo htmlspecialchars($download['url']); ?>">
                                        <div class="download-url">
                                            <a href="<?php echo htmlspecialchars($download['url']); ?>" target="_blank" rel="noopener noreferrer">
                                                <?php echo htmlspecialchars($download['url']); ?>
                                            </a>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="format-badge"><?php echo htmlspecialchars($download['format']); ?></span>
                                    </td>
                                    <td>
                                        <div class="download-time"><?php echo formatTimestamp($download['timestamp']); ?></div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
        
        <!-- Action Buttons -->
        <div class="text-center mt-4">
            <a href="index.html" class="btn btn-secondary back-btn me-2">
                <i class="fas fa-home me-1"></i> Back to Website
            </a>
            <a href="logout.php" class="btn btn-danger logout-btn">
                <i class="fas fa-sign-out-alt me-1"></i> Logout
            </a>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
</body>

</html> 