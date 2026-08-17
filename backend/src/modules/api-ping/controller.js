const ApiRequest = require('./model');

const isUrlSafe = (urlString) => {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();
    
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.local') ||
      hostname === '127.0.0.1' ||
      hostname === '::1'
    ) {
      return false;
    }
    
    const privateIpRegex = /^(10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|192\.168\.\d+\.\d+)$/;
    if (privateIpRegex.test(hostname)) {
      return false;
    }

    if (hostname === '169.254.169.254') {
      return false;
    }

    return true;
  } catch (err) {
    return false;
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await ApiRequest.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved requests.' });
  }
};

exports.saveRequest = async (req, res) => {
  try {
    const { id, name, url, method, headers, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    let request;
    if (id && id !== 'new') {
      request = await ApiRequest.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { name, url, method, headers, body },
        { new: true }
      );
    } else {
      request = new ApiRequest({
        userId: req.user.id,
        name: name || 'New Request',
        url,
        method,
        headers: headers || [],
        body: body || '',
      });
      await request.save();
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save request.' });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    await ApiRequest.findOneAndDelete({ _id: id, userId: req.user.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete request.' });
  }
};

exports.proxyRequest = async (req, res) => {
  try {
    const { url, method, headers, body } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required.' });
    }

    if (!isUrlSafe(url)) {
      return res.status(400).json({ error: 'Invalid or restricted URL.' });
    }

    // Convert headers array/object to standard fetch headers
    const requestHeaders = {};
    if (Array.isArray(headers)) {
      headers.forEach(h => {
        if (h.key && h.value) {
          const lowerKey = h.key.toLowerCase();
          if (lowerKey !== 'host' && lowerKey !== 'content-length') {
            requestHeaders[h.key] = h.value;
          }
        }
      });
    } else if (headers && typeof headers === 'object') {
      Object.keys(headers).forEach(key => {
        const lowerKey = key.toLowerCase();
        if (lowerKey !== 'host' && lowerKey !== 'content-length') {
          requestHeaders[key] = headers[key];
        }
      });
    }

    const fetchOptions = {
      method: method || 'GET',
      headers: requestHeaders,
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && body) {
      fetchOptions.body = typeof body === 'object' ? JSON.stringify(body) : body;
      if (!requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
        fetchOptions.headers['Content-Type'] = 'application/json';
      }
    }

    const startTime = Date.now();
    
    // Set a strict 15s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    fetchOptions.signal = controller.signal;

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      const responseText = await response.text();

      // Read headers
      const responseHeaders = {};
      response.headers.forEach((value, name) => {
        responseHeaders[name] = value;
      });

      res.json({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data: responseText,
        time: responseTime,
        size: responseText.length,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ error: 'Request timed out after 15 seconds.' });
      }
      return res.status(502).json({ error: fetchError.message || 'Failed to fetch the target URL.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal proxy error.' });
  }
};
