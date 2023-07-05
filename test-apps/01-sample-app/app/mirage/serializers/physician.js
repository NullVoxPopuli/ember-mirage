/* eslint-disable ember/avoid-leaking-state-in-ember-objects */
import ApplicationSerializer from './application';

export default ApplicationSerializer.extend({
  primaryKey: 'physicianId',
  transforms: {
    network: { key: 'networkId' },
  },
});
