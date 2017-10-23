var mongoose =  require('mongoose');
var Schema = mongoose.Schema;

var messageSchema = new Schema({
    by : {type:String},
    message : {type:String},
    date: { type: Date, default: Date.now },

})

var Message = mongoose.model('Message',messageSchema);
module.exports = Message;