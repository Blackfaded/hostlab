const mongoose = require('mongoose');
const slugify = require('slugify');

const { getStatusOfApplication } = require('../common/docker');

// Fixes deprecation warning
mongoose.Promise = Promise;

const applicationSchema = mongoose.Schema({
    name: String,
    port: Number,
    created: {
    type: Date,
        default: Date.now,
    },
    repoName: String,
    repoID: Number,
    repoBranch: String,
    autostart: Boolean,
});

applicationSchema.post('init', async function() {
    this.isRunning = await getStatusOfApplication(this._id) === "running";
});


applicationSchema.virtual('mountPath').get(function() {
    const userObj = this.parent().email.split('@');
    return `/${userObj[1]}/${userObj[0]}/${slugify(this.name)}`;
});

module.exports = applicationSchema;
