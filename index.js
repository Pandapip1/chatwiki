// Simple web server. Proxy all requests to the relevant wikipedia server.
import * as express from 'express';
import * as http from 'http';
import * as serveStatic from 'serve-static';

const app = express();

// Serve static files from the 'public' folder.
app.use(serveStatic('public'));

// Proxy all requests to the relevant wikipedia server.
app.use('/favicon.ico', (req, res) => {
    const url = 'https://www.wikipedia.org/static/favicon/wikipedia.ico';
    console.log('Proxying request to ' + url);
    http.get(url, (response) => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
    });
});

app.use('/legal', (req, res) => {
    // Redirect to the relevant wikipedia server.
    res.redirect('https://meta.wikimedia.org/wiki/Terms_of_use');
});

app.use('/api/rest_v1/openapi.yaml', (req, res) => {
    const url = 'https://en.wikipedia.org/api/rest_v1/?spec';
    console.log('Proxying request to ' + url);
    http.get(url, (response) => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
    });
});

app.use('/api/*', (req, res) => {
    const url = 'https://en.wikipedia.org' + req.url;
    console.log('Proxying request to ' + url);
    http.get(url, (response) => {
        res.writeHead(response.statusCode, response.headers);
        response.pipe(res);
    });
});

// Start the server.
const port = process.env.PORT || 3000;
http.createServer(app).listen(port, () => {
    console.log('Server listening on port ' + port);
});
