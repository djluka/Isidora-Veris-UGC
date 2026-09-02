import { DuplicateSubscriberError } from '../repositories/subscribers.mjs';

/**
 * The subscription use case. Knows nothing about HTTP -- it takes an already
 * validated email and service, and returns a result the transport can map to
 * a status code.
 */
export function createSubscriptionService({ repository, emailService }) {
    /**
     * Dispatched without awaiting: a Resend or database-count outage must
     * never fail a subscription that is already persisted.
     */
    function dispatchEmails(subscriber) {
        emailService
            .sendConfirmation(subscriber.email, subscriber.service)
            .catch((error) => console.error('Confirmation email error:', error));

        repository
            .count()
            .then((total) => emailService.sendOwnerNotification(subscriber, total))
            .catch((error) => console.error('Owner notification error:', error));
    }

    return {
        async subscribe({ email, service }) {
            let subscriber;

            try {
                // The unique key is the authority on duplicates; no pre-check can
                // close the race that INSERT closes on its own.
                subscriber = await repository.create(email, service);
            } catch (error) {
                if (error instanceof DuplicateSubscriberError) return { status: 'duplicate' };
                throw error;
            }

            dispatchEmails(subscriber);
            return { status: 'created', subscriber };
        },
    };
}
