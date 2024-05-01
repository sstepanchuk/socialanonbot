FROM alpine:3.14

# Install required dependencies
RUN apk add --no-cache jq

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh

# Set entrypoint script as executable
RUN chmod +x /entrypoint.sh

# Run entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
