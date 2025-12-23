#!/usr/bin/env python3
"""
Main application file for the Cheque Information Extractor.
Serves the frontend files.
"""

import http.server
import socketserver
import os
import sys

def serve_frontend():
    """Serve the frontend files"""
    print("Starting frontend server...")
    
    # Change to the frontend directory
    frontend_dir = os.path.join(os.path.dirname(__file__), 'src', 'web', 'frontend')
    if os.path.exists(frontend_dir):
        os.chdir(frontend_dir)
    else:
        print(f"Frontend directory not found: {frontend_dir}")
        sys.exit(1)

    # Set the port
    PORT = 8080

    # Create handler
    Handler = http.server.SimpleHTTPRequestHandler

    # Start server
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Frontend server running at http://localhost:{PORT}/")
        print("Press Ctrl+C to stop the server")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

def main():
    """Main function to serve frontend"""
    print("Cheque Information Extractor Frontend")
    print("====================================")
    
    # Serve frontend
    serve_frontend()

if __name__ == "__main__":
    main()
