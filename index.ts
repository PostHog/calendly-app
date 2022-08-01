async function setupPlugin({ config, global }) {
    global.calendlyEventName = config.calendlyEventName

    global.defaultHeaders = {
        headers: {
            Authorization: `Bearer ${config.calendlyApiKey}`,
            'Content-Type': 'application/json',
        },
    }

    let authResponse
    try {
        authResponse = await fetch('https://api.calendly.com/users/me', global.defaultHeaders)
    } catch (e) {
        throw new RetryError(e.message)
    }

    if (!authResponse.ok) {
        throw new Error(
            'Unable to connect to Calendly. Please make sure your API key is correct and that it has the required permissions.'
        )
    }
}

/* Runs on every event */
async function processEvent(event, meta) {
    // Check that we have a matching event
    if (event.event === meta.config.calendlyEventName) {
        // If the event URI is set get the data from it
        if (event.properties['calendly_event_uri']) {
            const eventResponse = await fetch(event.properties['calendly_event_uri'], meta.global.defaultHeaders)
            if (eventResponse.ok) {
                let eventJson = await eventResponse.json()
                event.properties['calendly_event_name'] = eventJson.resource.name
                event.properties['calendly_event_start'] = eventJson.resource.start_time
                event.properties['calendly_event_end'] = eventJson.resource.end_time

                // Get the calendar owner email
                const ownerResponse = await fetch(
                    eventJson.resource.event_memberships[0].user,
                    meta.global.defaultHeaders
                )

                if (ownerResponse.ok) {
                    let ownerJson = await ownerResponse.json()
                    event.properties['calendly_owner'] = ownerJson.resource.email
                } else {
                    console.log(
                        `Got ${ownerResponse.status} ${ownerResponse.statusText} when loading Owner data from ${ownerResponse.url}`
                    )
                }
            } else {
                console.log(
                    `Got ${eventResponse.status} ${eventResponse.statusText} when loading Event data from ${eventResponse.url}`
                )
            }
        } else {
            console.log('No event URI, skipping')
        }

        if (event.properties['calendly_invitee_uri']) {
            const inviteeResponse = await fetch(event.properties['calendly_invitee_uri'], meta.global.defaultHeaders)
            if (inviteeResponse.ok) {
                let inviteeJson = await inviteeResponse.json()
                event.properties['distinct_id'] = inviteeJson.resource.email
                event.properties['email'] = inviteeJson.resource.email

                const questions_array = inviteeJson.resource.questions_and_answers

                for (var i = 0; i < questions_array.length; i++) {
                    let item = questions_array[i]
                    event.properties[toSnakeCase(item.question)] = item.answer
                }
            } else {
                console.log(
                    `Got ${inviteeResponse.status} ${inviteeResponse.statusText} when loading Invitee data from ${inviteeResponse.url}`
                )
            }
        } else {
            console.log('No invitee URI, skipping')
        }
    }
    // Return the event to ingest, return nothing to discard
    return event
}

// Takes any Calendly question keys and turns them into snake_case
function toSnakeCase(str = '') {
    const strArr = str.replace(/\?/, '').split(' ')
    const snakeArr = strArr.reduce((acc, val) => {
        return acc.concat(val.toLowerCase())
    }, [])
    return snakeArr.join('_')
}
