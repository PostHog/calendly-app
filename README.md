# PostHog Plugin: Calendly
## Category: Data in
Enrich Calendly events which have `calendly_event_url` and `calendly_invitee_url` properties set with additional
information from those URLs.  Set the Calendly API key and the event name to watch for enrichment.

This app assumes that you're using [react-calendly](https://www.npmjs.com/package/react-calendly) to send capture 
events into PostHog after an event has been scheduled in Calendly.

## Installation

1. Access PostHog's **Apps** page from the sidebar.
1. To perform installation either:
  1. go to the **Repository** tab, find this plugin, and **Install** it,
  1. or go to the **Advanced** tab and **Fetch and install** the following URL in the **Install from GitHub, GitLab or npm** section:  
     `https://github.com/posthog/calendly-app`.
1. Configure the plugin by entering your Calendly API key and the name of the event to enrich.

## Capture example using react-calendly

```
const calendlyEventScheduled = (e: EventScheduledEvent) => {
        const { event, payload = null } = e.data
        posthog?.capture(event, {
            calendly_event_uri: payload?.event.uri,
            calendly_invitee_uri: payload?.invitee.uri,
        })
    }
```

## Properties set by the app

If available in the event and invitee URLs, the following properties will be set:

* From `calendly_event_url`:
  * `calendly_event_name` - the name of the event
  * `calendly_event_start` - the scheduled start time of the event
  * `calendly_event_end` - the scheduled end time of the event
  * `calendly_owner` - the email address of the event owner
* From `calendly_invitee_url`:
  * `distinct_id` - the email address of the person who booked the event
  * `email` - the email address of the person who booked the event
  * Any questions as properties and answers as values from the `questions_and_answers` invitee record


