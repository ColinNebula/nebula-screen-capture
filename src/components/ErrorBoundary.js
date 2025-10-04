import React from 'react';
import NebulaLogo from './NebulaLogo';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo || { componentStack: 'No stack trace available' }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
        <div className="error-content">
          <NebulaLogo size={64} color="#dc2626" />
          <h2>Oops! Something went wrong</h2>
          <p>The screen recorder encountered an unexpected error.</p>            <div className="error-details">
              <details>
                <summary>Error Details (for debugging)</summary>
                {this.state.error && (
                  <pre>{this.state.error.toString()}</pre>
                )}
                {this.state.errorInfo && this.state.errorInfo.componentStack && (
                  <pre>{this.state.errorInfo.componentStack}</pre>
                )}
                {(!this.state.errorInfo || !this.state.errorInfo.componentStack) && (
                  <pre>No additional error information available</pre>
                )}
              </details>
            </div>
            
            <div className="error-actions">
              <button 
                onClick={() => window.location.reload()}
                className="reload-btn"
              >
                Reload App
              </button>
              <button 
                onClick={() => this.setState({ 
                  hasError: false, 
                  error: null, 
                  errorInfo: null 
                })}
                className="retry-btn"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;