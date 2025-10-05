import axios from 'axios'

class BackendConnection {
  constructor() {
    this.connectedBackend = null
    this.connecting = false
    this.connectionPromise = null
  }

  // Parse backend URLs from environment variable
  getBackendList() {
    const backendsEnv = import.meta.env.VITE_BACKENDS
    return backendsEnv.split(',').map(url => url.trim())
  }

  // Test if a backend is available
  async testBackend(backendUrl) {
    try {
      // Try to fetch stats endpoint as a health check
      const response = await axios.get(`${backendUrl}/stats`, {
        timeout: 3000, // 3 second timeout
        headers: {
          'Accept': 'application/json'
        }
      })
      return response.status === 200
    } catch (error) {
      console.log(`Backend ${backendUrl} not available:`, error.message)
      return false
    }
  }

  // Connect to the first available backend
  async connect() {
    // If already connected, return the connected backend
    if (this.connectedBackend) {
      return this.connectedBackend
    }

    // If already connecting, wait for that connection attempt
    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise
    }

    // Start new connection attempt
    this.connecting = true
    this.connectionPromise = this._attemptConnection()
    
    try {
      const result = await this.connectionPromise
      return result
    } finally {
      this.connecting = false
    }
  }

  async _attemptConnection() {
    const backends = this.getBackendList()
    console.log('Attempting to connect to backends:', backends)

    for (const backend of backends) {
      console.log(`Trying backend: ${backend}`)
      const isAvailable = await this.testBackend(backend)
      
      if (isAvailable) {
        this.connectedBackend = backend
        console.log(`✓ Successfully connected to backend: ${backend}`)
        return backend
      }
    }

    // If no backend is available, throw an error
    const error = new Error('No backend available. Please ensure at least one backend is running.')
    console.error(error.message)
    throw error
  }

  // Get axios instance configured for the connected backend
  async getAxios() {
    const backend = await this.connect()
    
    return axios.create({
      baseURL: backend,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout for requests
    })
  }

  // Get the connected backend URL
  async getBackendUrl() {
    return await this.connect()
  }

  // Force reconnection (useful for testing or manual refresh)
  reset() {
    this.connectedBackend = null
    this.connecting = false
    this.connectionPromise = null
  }
}

// Export a singleton instance
export const backendConnection = new BackendConnection()

// Export a convenience method to get axios instance
export async function getApi() {
  return await backendConnection.getAxios()
}

// Export a convenience method to get backend URL
export async function getBackendUrl() {
  return await backendConnection.getBackendUrl()
}

