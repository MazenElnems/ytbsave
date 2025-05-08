<?php
session_start();

// Define admin data directory
$dataDir = 'admin/data';
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}

// Create admin.json if it doesn't exist
$adminFile = "$dataDir/admin.json";
if (!file_exists($adminFile)) {
    $adminData = [
        'username' => 'admin',
        'password' => password_hash('admin123', PASSWORD_DEFAULT)
    ];
    file_put_contents($adminFile, json_encode($adminData, JSON_PRETTY_PRINT));
}

// Check if already logged in
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    header('Location: admin.php');
    exit;
}

$error = '';

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Load admin credentials
    $adminData = json_decode(file_get_contents($adminFile), true);
    
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    // Validate credentials
    if ($username === $adminData['username'] && password_verify($password, $adminData['password'])) {
        // Set session
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $username;
        
        // Redirect to admin dashboard
        header('Location: admin.php');
        exit;
    } else {
        $error = 'Invalid username or password';
    }
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Ytbsave Admin</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" integrity="sha512-9usAa10IRO0HhonpyAIVpjrylPvoDwiPUiKdWk5t3PyolY1cOd4DSE0Ga+ri4AuTroPR5aQvXU9xC6qOPnzFeg==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />
    <link rel="stylesheet" type="text/css" href="style.css">
    <link rel="icon" href="/Ytbsave/logo.png" sizes="32x32" type="image/png">
    <style>
        body {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .login-container {
            background-color: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            padding: 2.5rem;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
            max-width: 450px;
            width: 100%;
        }
        
        .login-logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 2rem;
        }
        
        .login-logo img {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            margin-right: 1rem;
        }
        
        .login-logo span {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary-color);
        }
        
        .btn-login {
            background-color: var(--primary-color);
            border: none;
            padding: 0.75rem 1.5rem;
            font-weight: 600;
            width: 100%;
            transition: all 0.3s ease;
        }
        
        .btn-login:hover {
            background-color: var(--primary-dark);
            transform: translateY(-3px);
            box-shadow: 0 7px 15px rgba(67, 97, 238, 0.3);
        }
        
        .form-control {
            padding: 0.75rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 10px;
        }
        
        .go-back {
            margin-top: 1.5rem;
            text-align: center;
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="login-container animate__animated animate__fadeIn">
                    <div class="login-logo">
                        <img src="logo.png" alt="Ytbsave Logo">
                        <span>Ytbsave</span>
                    </div>
                    
                    <h2 class="text-center mb-4">Admin Login</h2>
                    
                    <?php if ($error): ?>
                    <div class="alert alert-danger animate__animated animate__shakeX">
                        <?php echo $error; ?>
                    </div>
                    <?php endif; ?>
                    
                    <form method="post">
                        <div class="mb-3">
                            <label for="username" class="form-label">Username</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-user"></i></span>
                                <input type="text" class="form-control" id="username" name="username" required>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <label for="password" class="form-label">Password</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-lock"></i></span>
                                <input type="password" class="form-control" id="password" name="password" required>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary btn-login">
                            <i class="fas fa-sign-in-alt me-2"></i> Login
                        </button>
                    </form>
                    
                    <div class="go-back">
                        <a href="index.html" class="text-decoration-none">
                            <i class="fas fa-arrow-left me-1"></i> Back to Website
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
</body>

</html> 