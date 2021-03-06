/**
 * Created by julia on 07.11.2016.
 */
let Command = require('../../structures/command');
let winston = require('winston');
let Selector = require('../../structures/selector');
let track_error = !require('../../config/main.json').no_error_tracking;
/**
 * The play command
 * plays a song duh.
 * @extends Command
 *
 */
class Play extends Command {
    /**
     * Create the command
     * @param {Function} t - the translation module
     * @param {Object} v - the voice manager
     * @param mod The module manager
     */
    constructor({t, v, mod}) {
        super();
        this.cmd = "play";
        this.cat = "music";
        this.needGuild = true;
        this.t = t;
        this.v = v;
        this.r = mod.getMod('raven');
        this.accessLevel = 0;
    }

    run(msg) {
        this.v.addToQueue(msg, true).then(result => {
            switch (result.type) {
                case "added":
                    msg.channel.createMessage(this.t('qa.success', {song: result.data.title, lngs: msg.lang}));
                    return;
                case "search_result":
                    this.searchResult(msg, result.data);
                    return;

            }
        }).catch(err => {
            console.error(err);
            if (track_error) {
                if (typeof(err) === 'object') {
                    err = err.err;
                }
                this.r.captureException(err, {
                    extra: {
                        userId: msg.author.id,
                        guildId: msg.guild.id,
                        msg: msg.content,
                        msgId: msg.id
                    }
                });
            }
            msg.channel.createMessage(this.t('generic.error', {lngs: msg.lang}));
        });
    }

    searchResult(msg, results) {
        let selector = new Selector(msg, results, this.t, (err, number) => {
            if (err) {
                return msg.channel.createMessage(this.t(err, {lngs: msg.lang}));
            }
            msg.content = `https://youtube.com/watch?v=${results[number - 1].id}`;
            this.run(msg);
        });
    }
}
module.exports = Play;