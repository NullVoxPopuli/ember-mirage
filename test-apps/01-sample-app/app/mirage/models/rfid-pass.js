import { belongsTo,Model } from 'miragejs';

export default Model.extend({
  user: belongsTo('user'),
  facility: belongsTo('facility'),
});
