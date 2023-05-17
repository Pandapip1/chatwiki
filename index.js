// Simple web server. Proxy all requests to the relevant wikipedia server.
import express from 'express';
import axios from 'axios';

import packageJson from './package.json' assert { type: "json" };

// Config
const userAgent = `${packageJson.name}/${packageJson.version}`;
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

// Create the express app.
const app = express();

// AI-plugin
app.get('/.well-known/ai-plugin.json', async (req, res) => {
    res.status(200).json({
        schema_version: "v1",
        name_for_human: packageJson.humanName,
        name_for_model: packageJson.name,
        description_for_human: packageJson.description,
        description_for_model: packageJson.description,
        auth: {
            type: "none"
        },
        api: {
            type: "openapi",
            url: `https://${req.headers.host}/api/rest_v1/openapi.yaml`,
            is_user_authenticated: false
        },
        logo_url: `https://${req.headers.host}/favicon.ico`,
        contact_email: packageJson.author.email,
        legal_info_url: `https://${req.headers.host}/legal`,
    });
});

// Proxy all requests to the relevant wikipedia server.
app.get('/favicon.ico', async (req, res) => {
    let response = await axios.get('https://www.wikipedia.org/static/favicon/wikipedia.ico', {
        headers: {
            ...req.headers,
            'X-Forwarded-Host': req.headers.host,
            'X-Forwarded-Proto': req.protocol,
            'X-Forwarded-For': req.ip,
            'Forwarded': `by=${req.ip}; for=${req.ip}; host=${req.headers.host}; proto=${req.protocol}`,
            'User-Agent': userAgent,
        },
        responseType: 'stream',
    });
    res.writeHead(response.status, response.headers);
    response.data.pipe(res);
});

app.get('/legal', async (req, res) => {
    // Redirect to the relevant wikipedia server.
    res.redirect('https://meta.wikimedia.org/wiki/Terms_of_use');
});

app.get('/api/rest_v1/openapi.yaml', async (req, res) => {
    let response = await axios.get('https://en.wikipedia.org/api/rest_v1/?spec', {
        headers: {
            ...req.headers,
            'X-Forwarded-Host': req.headers.host,
            'X-Forwarded-Proto': req.protocol,
            'X-Forwarded-For': req.ip,
            'Forwarded': `by=${req.ip}; for=${req.ip}; host=${req.headers.host}; proto=${req.protocol}`,
            'User-Agent': userAgent,
        },
        responseType: 'stream',
    });
    res.writeHead(response.status, response.headers);
    response.data.pipe(res);
});

app.use('/api/*', async (req, res) => {
    let response = await axios(`https://en.wikipedia.org/${req.url}`, {
        method: req.method,
        headers: {
            ...req.headers,
            'X-Forwarded-Host': req.headers.host,
            'X-Forwarded-Proto': req.protocol,
            'X-Forwarded-For': req.ip,
            'Forwarded': `by=${req.ip}; for=${req.ip}; host=${req.headers.host}; proto=${req.protocol}`,
            'User-Agent': userAgent,
        },
        responseType: 'stream',
    });
    res.writeHead(response.status, response.headers);
    response.data.pipe(res);
});

// Start the server.
app.listen(port, host, () => {
    let printHost = host;
    if (host == '0.0.0.0') {
        printHost = 'localhost';
    }
    console.log(`Server running at http://${printHost}:${port}/`);
});
