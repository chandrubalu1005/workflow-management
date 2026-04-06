export const notifySlack = async (task, user) => {
    if (!process.env.SLACK_WEBHOOK_URL) return;
    try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: `*Task Completed!* 🎉\n> _${task.title}_\n`
            })
        });
    } catch (e) {
        console.error('Slack webhook failed:', e.message);
    }
};
