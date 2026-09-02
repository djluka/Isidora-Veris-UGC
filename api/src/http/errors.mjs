export function notFound(_request, response) {
    return response.status(404).json({ message: 'Not found' });
}

export function errorHandler(label, parseErrorMessage) {
    return (error, _request, response, _next) => {
        console.error(`${label}:`, error);
        if (error?.type === 'entity.parse.failed' || error?.type === 'entity.too.large') {
            return response.status(400).json({ message: parseErrorMessage });
        }
        response.status(500).json({ message: 'Internal server error' });
    };
}
