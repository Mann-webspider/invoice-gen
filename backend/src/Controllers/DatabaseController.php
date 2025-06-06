<?php

namespace Shelby\OpenSwoole\Controllers;

use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Exception;
use DateTime;

class DatabaseController
{
    private $db;
    private $backupDir;
    private $dbPath;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->backupDir = __DIR__ . '/../../database/backups';
        $this->dbPath = __DIR__ . '/../../database/database.sqlite';
        
        // Create backup directory if it doesn't exist
        if (!file_exists($this->backupDir)) {
            mkdir($this->backupDir, 0755, true);
        }
    }

    public function createBackup(Request $request, Response $response)
    {
        try {
            // Check if database file exists
            if (!file_exists($this->dbPath)) {
                throw new Exception('Database file not found');
            }

            // Generate backup filename with timestamp
            $timestamp = (new DateTime())->format('Y-m-d_H-i-s');
            $backupFile = $this->backupDir . "/backup_{$timestamp}.sqlite";

            // Lock the database file
            $this->db->exec('BEGIN IMMEDIATE');

            // Copy the database file
            if (!copy($this->dbPath, $backupFile)) {
                $this->db->exec('ROLLBACK');
                throw new Exception('Failed to create backup file');
            }

            // Unlock the database
            $this->db->exec('COMMIT');
            
            $response->getBody()->write(json_encode([
                'status' => 'success',
                'message' => 'Backup created successfully',
                'backup_file' => basename($backupFile)
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Backup failed: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function downloadBackup(Request $request, Response $response, array $args)
    {
        try {
            if (!isset($args['filename'])) {
                throw new Exception('Backup filename is required');
            }

            $backupFile = $this->backupDir . '/' . $args['filename'];
            if (!file_exists($backupFile)) {
                throw new Exception('Backup file not found');
            }

            // Set headers for file download
            $response = $response->withHeader('Content-Type', 'application/octet-stream')
                                ->withHeader('Content-Disposition', 'attachment; filename="' . $args['filename'] . '"')
                                ->withHeader('Content-Length', filesize($backupFile));

            // Read and output the file
            $stream = fopen($backupFile, 'r');
            $response->getBody()->write(stream_get_contents($stream));
            fclose($stream);

            return $response;

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Download failed: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function restoreFromUpload(Request $request, Response $response)
    {
        try {
            $uploadedFiles = $request->getUploadedFiles();
            if (!isset($uploadedFiles['backup'])) {
                throw new Exception('No backup file uploaded');
            }

            $uploadedFile = $uploadedFiles['backup'];
            if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
                throw new Exception('File upload failed');
            }

            // Validate file type
            $mimeType = $uploadedFile->getClientMediaType();
            if ($mimeType !== 'application/octet-stream' && $mimeType !== 'application/x-sqlite3') {
                throw new Exception('Invalid file type. Only SQLite database files are allowed');
            }

            // Create a temporary backup of current database
            $tempBackup = $this->backupDir . '/temp_' . basename($this->dbPath);
            if (file_exists($this->dbPath)) {
                if (!copy($this->dbPath, $tempBackup)) {
                    throw new Exception('Failed to create temporary backup');
                }
            }

            try {
                // Close all database connections
                $this->db = null;

                // Move uploaded file to database location
                $uploadedFile->moveTo($this->dbPath);

                // Verify the restored database
                $this->verifyDatabase();

                // Remove temporary backup
                if (file_exists($tempBackup)) {
                    unlink($tempBackup);
                }

                $response->getBody()->write(json_encode([
                    'status' => 'success',
                    'message' => 'Database restored successfully from uploaded file'
                ]));
                return $response->withHeader('Content-Type', 'application/json');

            } catch (Exception $e) {
                // Restore from temporary backup if something goes wrong
                if (file_exists($tempBackup)) {
                    copy($tempBackup, $this->dbPath);
                    unlink($tempBackup);
                }
                throw $e;
            }

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Restore failed: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function restoreBackup(Request $request, Response $response, array $args)
    {
        try {
            if (!isset($args['filename'])) {
                throw new Exception('Backup filename is required');
            }

            $backupFile = $this->backupDir . '/' . $args['filename'];
            if (!file_exists($backupFile)) {
                throw new Exception('Backup file not found');
            }

            // Create a temporary backup of current database
            $tempBackup = $this->backupDir . '/temp_' . basename($this->dbPath);
            if (file_exists($this->dbPath)) {
                if (!copy($this->dbPath, $tempBackup)) {
                    throw new Exception('Failed to create temporary backup');
                }
            }

            try {
                // Close all database connections
                $this->db = null;

                // Copy backup file to database location
                if (!copy($backupFile, $this->dbPath)) {
                    throw new Exception('Failed to restore database');
                }

                // Verify the restored database
                $this->verifyDatabase();

                // Remove temporary backup
                if (file_exists($tempBackup)) {
                    unlink($tempBackup);
                }

                $response->getBody()->write(json_encode([
                    'status' => 'success',
                    'message' => 'Database restored successfully'
                ]));
                return $response->withHeader('Content-Type', 'application/json');

            } catch (Exception $e) {
                // Restore from temporary backup if something goes wrong
                if (file_exists($tempBackup)) {
                    copy($tempBackup, $this->dbPath);
                    unlink($tempBackup);
                }
                throw $e;
            }

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Restore failed: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function listBackups(Request $request, Response $response)
    {
        try {
            $backups = [];
            $files = glob($this->backupDir . '/backup_*.sqlite');
            
            foreach ($files as $file) {
                $backups[] = [
                    'filename' => basename($file),
                    'size' => filesize($file),
                    'created_at' => date('Y-m-d H:i:s', filemtime($file))
                ];
            }

            // Sort backups by creation date (newest first)
            usort($backups, function($a, $b) {
                return strtotime($b['created_at']) - strtotime($a['created_at']);
            });

            $response->getBody()->write(json_encode([
                'status' => 'success',
                'backups' => $backups
            ]));
            return $response->withHeader('Content-Type', 'application/json');

        } catch (Exception $e) {
            $response->getBody()->write(json_encode([
                'status' => 'error',
                'message' => 'Failed to list backups: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function verifyDatabase()
    {
        try {
            // Reconnect to the database
            $this->db = new PDO('sqlite:' . $this->dbPath);
            $this->db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Verify database integrity
            $this->db->query('PRAGMA integrity_check');
            
            // Verify all tables exist
            $tables = ['exporters_dropdown', 'suppliers_dropdown', 'arn_dropdown', 'product_category', 'product_size_dropdown'];
            foreach ($tables as $table) {
                $stmt = $this->db->query("SELECT name FROM sqlite_master WHERE type='table' AND name='{$table}'");
                if (!$stmt->fetch()) {
                    throw new Exception("Table {$table} not found in restored database");
                }
            }
        } catch (Exception $e) {
            throw new Exception('Database verification failed: ' . $e->getMessage());
        }
    }
} 