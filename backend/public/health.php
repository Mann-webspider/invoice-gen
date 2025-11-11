<?php
// Simple health check - bypasses license check
http_response_code(200);
echo json_encode(['status' => 'ok', 'timestamp' => time()]);
