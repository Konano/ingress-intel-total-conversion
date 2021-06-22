/* global script_info, app */

window.aboutIITC = function() {
  var iitc = script_info;
  var iitcVersion = (iitc.script && iitc.script.version || iitc.dateTimeVersion) + ' [' + iitc.buildName + ']';

  var html = createDialogContent(iitc, iitcVersion);

  dialog({
    title: 'IITC ' + iitcVersion,
    id: 'iitc-about',
    html: html,
    width: 'auto',
    dialogClass: 'ui-dialog-aboutIITC'
  });
}

function createDialogContent(iitc, iitcVersion) {
  var html = ''
    + '<div><b>About IITC</b></div> '
    + '<div>Ingress Intel Total Conversion</div> '
    + '<hr>'
    + '<div>'
    + '  <a href="'+'@url_homepage@'+'" target="_blank">IITC Homepage</a> |'
    + '  <a href="'+'@url_tg@'+'" target="_blank">Telegram channel</a><br />'
    + '   On the script’s homepage you can:'
    + '   <ul>'
    + '     <li>Find Updates</li>'
    + '     <li>Get Plugins</li>'
    + '     <li>Report Bugs</li>'
    + '     <li>Contribute!</li>'
    + '   </ul>'
    + '</div>'
    + '<hr>'
    + '<div>Version: ' + iitcVersion + '</div>';

  if (window.isApp && app.getVersionName) {
    html += '<div>IITC Mobile ' + app.getVersionName() + '</div>';
  }

  var plugins = getPlugins(iitc);
  if (plugins) {
    html += '<div><p>Plugins:</p><ul>' + plugins + '</ul></div>';
  }

  return html;
}

function getPlugins(iitc) {

  // Plugins metadata come from 2 sources:
  // - buildName, pluginId, dateTimeVersion: inserted in plugin body by build script
  //   (only standard plugins)
  // - script.name/version/description: from GM_info object, passed to wrapper
  //   `script` may be not available if userscript manager does not provede GM_info
  //   (atm: IITC-Mobile for iOS)
  var pluginsInfo = window.bootPlugins.info;

  function prepData(info, idx) { // try to gather plugin metadata from both sources
    var data = {
      build: info.buildName,
      name: info.pluginId,
      date: info.dateTimeVersion,
      error: info.error
    };
    var script = info.script;
    if (script) {
      if (typeof script.name === 'string') { // cut non-informative name part
        data.name = script.name.replace(/^IITC plugin: /, '');
      }
      data.version = script.version;
      data.description = script.description;
    }
    if (!data.name) {
      if (iitc.script) { // check if GM_info is available
        data.name = '[unknown plugin: index ' + idx + ']';
        data.description = "this plugin does not have proper wrapper; report to it's author";
      } else { // userscript manager fault
        data.name = '[3rd-party plugin: index ' + idx + ']';
      }
    }
    return data;
  }

  var extra = iitc.script && iitc.script.version.match(/^\d+\.\d+\.\d+(\..+)$/);
  extra = extra && extra[1];

  var plugins = pluginsInfo.map(prepData)
    .sort(function (a,b) { return a.name > b.name ? 1 : -1; })
    .map(function (p) {
      p.style = '';
      p.description = p.description || '';
      if (p.error) {
        p.style += 'text-decoration:line-through;';
        p.description = p.error;
      } else if (isStandardPlugin(p)) { // is standard plugin
        p.style += 'color:darkgray;';
      }
      p.verinfo = formatVerInfo(p, extra) || '';
      return L.Util.template('<li style="{style}" title="{description}">{name}{verinfo}</li>', p);
    })
    .join('\n');

  return plugins;
}

function isStandardPlugin(plugin) {
  return (plugin.build === iitc.buildName && plugin.date === iitc.dateTimeVersion)
}

function formatVerInfo (p, extra) {
  if (p.version && extra) {
    var cutPos = p.version.length-extra.length;
    // cut extra version component (timestamp) if it is equal to main script's one
    if (p.version.substring(cutPos) === extra) {
      p.version = p.version.substring(0,cutPos);
    }
  }
  p.version = p.version || p.date;
  if (p.version) {
    var tooltip = [];
    if (p.build) { tooltip.push('[' + p.build + ']'); }
    if (p.date && p.date !== p.version) { tooltip.push(p.date); }
    return L.Util.template(' - <code{title}>{version}</code>', {
      title: tooltip[0] ? ' title="' + tooltip.join(' ') + '"' : '',
      version: p.version
    });
  }
}
