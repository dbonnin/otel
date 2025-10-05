// Preload ADOT auto-instrumentation BEFORE your app
import '@aws/aws-distro-opentelemetry-node-autoinstrumentation/register';

// Then load your app
import './app';