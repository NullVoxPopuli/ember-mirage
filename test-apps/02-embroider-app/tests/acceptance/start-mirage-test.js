import { currentRouteName, visit } from '@ember/test-helpers';
import { module, test } from 'qunit';

import { mirageConfig } from 'embroider-app/mirage/config';
import { startMirage } from 'ember-mirage';
import { setupMirage, setupTest } from 'embroider-app/tests/helpers';
import ENV from 'embroider-app/config/environment';
import NestedThingModel from 'embroider-app/mirage/models/nested/thing';

module('Acceptance | Starting mirage', function (hooks) {
  let oldEnv, addonConfig, dynamicAfterEach;

  hooks.beforeEach(function () {
    oldEnv = ENV['ember-cli-mirage'];
    ENV['ember-cli-mirage'] = addonConfig = {};
    // When running in non-legacy mode we should ignore this, so we set it so we
    // can make sure that tests that it doesn't cause the server to start when
    // it shouldn't in the cases that test that
    addonConfig.enabled = true;

    dynamicAfterEach = () => undefined;
  });

  hooks.afterEach(function () {
    dynamicAfterEach();
  });

  hooks.afterEach(function () {
    ENV['ember-cli-mirage'] = oldEnv;
  });

  module('without autostart', function (hooks) {
    setupTest(hooks);

    test('it does not autostart but can be started manually', async function (assert) {
      assert.strictEqual(
        window.server,
        undefined,
        'There is no global server at first'
      );

      let server = startMirage(mirageConfig, { owner: this.owner, env: ENV });

      assert.ok(server, 'There is a server after starting');
      assert.ok(window.server, 'There is a global server after starting');
      dynamicAfterEach = () => server.shutdown();

      server.create('user');
      await visit('/crud-demo');

      assert.strictEqual(currentRouteName(), 'crud-demo');
      assert.dom('[data-test-id="user"]').exists();
    });

    module('nested mirage modules', function () {
      test('it works', async function (assert) {
        const server = startMirage(mirageConfig, {
          owner: this.owner,
          env: ENV,
        });
        const model = server.create('nested/thing');

        dynamicAfterEach = () => server.shutdown();

        assert.ok(model instanceof NestedThingModel, 'models');
        assert.strictEqual(
          model.id,
          'nested identity manager works!',
          'identity managers'
        );
        assert.strictEqual(model.name, 'nested factory works!', 'factories');

        const { attributes } =
          server.serializerOrRegistry.serialize(model).data;

        assert.ok('nested_thing_name' in attributes, 'serializer');
      });

      // factories and fixtures have to be tested separately
      test('fixtures support', async function (assert) {
        const server = startMirage(mirageConfig, {
          owner: this.owner,
          env: ENV,
        });

        dynamicAfterEach = () => server.shutdown();

        server.loadFixtures('nested/things');

        const model = server.schema.first('nested/thing');

        assert.ok(model instanceof NestedThingModel, 'models');
        assert.strictEqual(
          model.id,
          'nested identity manager works!',
          'identity managers'
        );
        assert.strictEqual(
          model.fixtureField,
          'nested fixture works!',
          'fixtures'
        );
      });
    });

    module('setupMirage()', function (hooks) {
      setupMirage(hooks);

      test('it works', async function (assert) {
        assert.ok(this.server, 'There is a server');
        assert.ok(window.server, 'There is a global server');

        dynamicAfterEach = () => {
          assert.notOk(this.server, 'The server was shut down');
          assert.notOk(window.server, 'The global server is gone');
        };

        this.server.create('user');
        await visit('/crud-demo');

        assert.strictEqual(currentRouteName(), 'crud-demo');
        assert.dom('[data-test-id="user"]').exists();
      });
    });
  });

  module('with autostart', function (hooks) {
    hooks.beforeEach(function () {
      addonConfig.autostart = true;
    });

    setupTest(hooks);

    test('it autostarts', async function (assert) {
      assert.ok(this.server, 'There is a server');
      assert.ok(window.server, 'There is a global server');

      dynamicAfterEach = () => {
        assert.notOk(this.server, 'The server was shut down');
        assert.notOk(window.server, 'The global server is gone');
      };

      this.server.create('user');
      await visit('/crud-demo');

      assert.strictEqual(currentRouteName(), 'crud-demo');
      assert.dom('[data-test-id="user"]').exists();
    });
  });
});
