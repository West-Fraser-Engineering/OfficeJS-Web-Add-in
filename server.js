const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a server instance
const server = http.createServer((req, res) => {
  // Extract the requested URL
  const requestedUrl = req.url === '/' ? '/index.html' : req.url;
  console.log(requested.url);
  
  // Construct the file path based on the requested URL
  const filePath = path.join(__dirname, 'public', requestedUrl);

  // Read the file content
  fs.readFile(filePath, (err, data) => {
    if (err) {
      // If the file is not found, return a 404 response
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('File not found');
    } else {
      // Determine the content type based on the file extension
      const extname = path.extname(filePath);
      const contentType = getContentType(extname);

      // Set the response header
      res.writeHead(200, {'Content-Type': contentType});

      // Send the file content
      res.end(data);
    }
  });
});

// Set the server to listen on port 3000
const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Function to determine content type based on file extension
function getContentType(extname) {
  switch (extname) {
    case '.html':
      return 'text/html';
    case '.js':
      return 'text/javascript';
    case '.css':
      return 'text/css';
    default:
      return 'text/plain';
  }
}
