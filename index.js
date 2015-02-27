var http = require('http');
var uuid = require('node-uuid');
var js2xmlparser = require("js2xmlparser");
var parsestring = require('xml2js').parseString;

var shell_id = null;
var params = {
	endpoint: 'http://127.0.0.1:5985/wsman',
	transport: 'plaintext',
	username: 'username',
	password: 'whatever',
	realm: 'computername',
	service: 'HTTP',
	keytab: 'none',
	ca_trust_path: '',
	cert_pem: '',
	cert_key_pem: ''
}

var connectparams = {
	i_stream: 'stdin',
	o_stream: 'stdout stderr',
	working_directory: 'None',
	env_vars: 'None',
	noprofile: 'False',
	codepage: '437',
	lifetime: 'None',
	idle_timeout: 'None'
}
function getsoapheader(resource_uri,action,callback) {
	if (!message_id) var message_id = uuid.v4();
	if (!resource_uri) var resource_uri = null;
	var header = {
		"@": {
			"xmlns:env": "http://www.w3.org/2003/05/soap-envelope",
			"xmlns:a": "http://schemas.xmlsoap.org/ws/2004/08/addressing",
			"xmlns:p": "http://schemas.microsoft.com/wbem/wsman/1/wsman.xsd",
			"xmlns:rsp": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell",
			"xmlns:w": "http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd"
		},
		"env:Header": {
			"a:To": "http://windows-host:5985/wsman",
			"a:ReplyTo": {
				"a:Address": {
					"@": {
						"mustUnderstand": "true"
					},
					"#": "http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous"
				}
			},
			"w:MaxEnvelopeSize": {
				"@": {
					"mustUnderstand": "true"
				},
				"#": "153600"
			},
			"a:MessageID": "uuid:" + message_id,
			"w:Locale": {
				"@": {
					"mustUnderstand": "false",
					"xml:lang": "en-US"
				}
			},
			"p:DataLocale": {
				"@": {
					"mustUnderstand": "false",
					"xml:lang": "en-US"
				}
			},
			"w:OperationTimeout": "PT60S",
			"w:ResourceURI": {
				"@": {
					"mustUnderstand": "true"
				},
				"#": resource_uri
			},
			"a:Action": {
				"@": {
					"mustUnderstand": "true"
				},
				"#": action
			}
		}
	}
	if (shell_id) {
		header['env:Header'] = {
			"w:SelectorSet": {
				"w:Selector": {
					"@": {
						"Name": "ShellId"
					},
					"#": shell_id
				}
			}
		}
	}
	
	console.log(header);
	callback(header);
}
function open_shell(callback) {
	getsoapheader('http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd','http://schemas.xmlsoap.org/ws/2004/09/transfer/Create',function(res) {
		res['env:Body'] = {
			"rsp:Shell": [
				{
					"rsp:InputStreams": "stdin",
					"rsp:OutputStreams": "stderr stdout"
				}
			]
		}
		res['env:Header'] = {
			"w:OptionSet": [
				{
					"w:Option": [
						{
							"@": {
								"Name": "WINRS_NOPROFILE"
							},
							"#": "FALSE"
						},
						{
							"@": {
								"Name": "WINRS_CODEPAGE"
							},
							"#": "437"
						}
					]
				}
			]
		}
		callback(res);
	});
//timeout should be PT60S = 60 seconds in ISO format
}

function run_command(command,shellid,callback) {
	getsoapheader('http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd','http://schemas.microsoft.com/wbem/wsman/1/windows/shell/Command', function(res) {
		res['env:Header'] = {
			"w:OptionSet": [
				{
					"@": {
						"Name": "WINRS_CONSOLEMODE_STDIN"
					}
					"#": "CONSOLE_MODE_STDIN"
				},
				{
					"@": {
						"Name": "WINRS_SKIP_CMD_SHELL"
					}
					"#": "SKIP_CMD_SHELL"
				}
			]
		}
		res['env:Body'] = {
			"rsp:CommandLine": {
				"rsp:Command": command
			}
		}
	});
	//convert to xml
	//send
	//find node with "CommandId"
});

function get_command_output(shellid,commandid) {
	getsoapheader('http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd','http://schemas.microsoft.com/wbem/wsman/1/windows/shell/Receive', function(res) {
		res['env:Body'] = {
			"rsp:Receive": {
				"rsp:DesiredStream": {
					"@": {
						"CommandId": commandid
					}
					"#": "stdout stderr"
				}
			}
		}
		//convert to xml
		//send
		//look for nodes with "Stream".name = 'stdout or 'stderr'
		var stdout, stderr = null;
		var return_code = "-1";
		//encode in ascii
		
	});
	/*
	# We may need to get additional output if the stream has not finished.
        # The CommandState will change from Running to Done like so:
        # @example
        #   from...
        #   <rsp:CommandState CommandId="..." State="http://schemas.microsoft.com/wbem/wsman/1/windows/shell/CommandState/Running"/>  # NOQA
        #   to...
        #   <rsp:CommandState CommandId="..." State="http://schemas.microsoft.com/wbem/wsman/1/windows/shell/CommandState/Done">  # NOQA
        #     <rsp:ExitCode>0</rsp:ExitCode>
        #   </rsp:CommandState>
        command_done = len([node for node in root.findall('.//*')
                           if node.get('State', '').endswith(
                            'CommandState/Done')]) == 1
        if command_done:
            return_code = int(next(node for node in root.findall('.//*')
                                   if node.tag.endswith('ExitCode')).text)

        return stdout, stderr, return_code, command_done
		
	*/
}

function cleanup_command(shellid,commandid,callback) {
	getsoapheader('http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd','http://schemas.microsoft.com/wbem/wsman/1/windows/shell/Signal', function(res) {
		res['env:Body'] = {
			"rsp:Signal": {
				"@": {
					"CommandId": commandid
				},
				"rsp:Code": "http://schemas.microsoft.com/wbem/wsman/1/windows/shell/signal/terminate"
			}
		}
		//convert to xml
		//send
		//find node with "RelatesTo"
		//make sure "RelatesTo" matches the UUID sent with it
	});
}

function close_shell(shellid,callback) {
	getsoapheader('http://schemas.microsoft.com/wbem/wsman/1/windows/shell/cmd','http://schemas.xmlsoap.org/ws/2004/09/transfer/Delete', function(res) {
		res['env:Body'] = { }
		//convert to xml
		//send
		//make sure "RelatesTo" matches the UUID sent with it
	});

open_shell(function(res) {
	console.log(res);
});

/*
init(function(res) {
	var xmldata = js2xmlparser('env:Envelope',res);
	var options = {
		hostname: '127.0.0.1',
		port: '5985',
		path: '/wsman',
		method: 'POST',
		headers: {
			'Content-Type': 'application/soap+xml;charset=UTF-8',
			'User-Agent': 'JS WinRM Client',
			'Content-Length': xmldata.length
		},
		auth: 'Basic ' + new Buffer(params.username + ':' + params.password).toString('base64')
	};
	var req = http.request(options, function(response) {
		console.log('STATUS: ' + response.statusCode);
		console.log('HEADERS: ' + JSON.stringify(response.headers));
		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			parsestring(chunk, function(err, result) {
				if (result['s:Envelope']['s:Body'][0]['s:Fault']) {
					//callback(new Error(result['s:Envelope']['s:Body'][0]['s:Fault'][0]['s:Code'][0]['s:Subcode'][0]['s:Value'][0]));
				}
				else {
					var shellid = result['s:Envelope']['s:Body'][0]['rsp:Shell'][0]['rsp:ShellId'][0];
					console.log(shellid);
				}
			});
		});
	});
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	req.write(xmldata);
	req.end();
});
*/

/*
class Session(object):
    # TODO implement context manager methods
    def __init__(self, target, auth, transport='plaintext'):
        username, password = auth
        self.url = self._build_url(target, transport)
        self.protocol = Protocol(self.url, transport=transport,
                                 username=username, password=password)
								 

    def run_cmd(self, command, args=()):
        # TODO optimize perf. Do not call open/close shell every time
        shell_id = self.protocol.open_shell()
        command_id = self.protocol.run_command(shell_id, command, args)
        rs = Response(self.protocol.get_command_output(shell_id, command_id))
        self.protocol.cleanup_command(shell_id, command_id)
        self.protocol.close_shell(shell_id)
        return rs			
*/		