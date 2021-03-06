import React from 'react';
import { Tab, Nav, Row, Col, Dropdown, SplitButton } from 'react-bootstrap';


export class ProtocolInspectorGroup extends React.Component {

  constructor(props) {
    super(props);
    this.fileInput = React.createRef();

    this.debugID = this.debugID.bind(this);
    this.loadProtocolFromFile = this.loadProtocolFromFile.bind(this);
  }

  debugID(protocol) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      return (<Dropdown.Header href="#">Protocol ID: {protocol.id}</Dropdown.Header>)
    }
    return null
  }

  loadProtocolFromFile(evt) {
    let file = evt.target.files[0];
    console.log("Loading protocol from file...")

    let reader = new FileReader();
    reader.onload = readerEvent => {
      try {
        let name = file.name.replace(/\.[^/.]+$/, "");
        let graph = JSON.parse(readerEvent.target.result);
        this.props.editor.displayNewProtocol(name, graph)
      } catch(error) {
        console.error(error)
      }
    }
    reader.readAsText(file,'UTF-8');
  }

  render() {
    let emptyProtocol = "+";
    let tabs = Object.entries(this.props.protocols).map(
                  ([pname, protocol], i)  =>  {
                    let className = null
                    if (this.props.editor.state.currentProtocol === protocol.name) {
                      className = "current-protocol"
                    }
                    return (
                      <SplitButton className={className} size="sm" variant="outline-primary" title={pname} key={i} onClick={() => this.props.editor.openProtocol(pname)}>
                        {this.debugID(protocol)}
                        <Dropdown.Item key={pname+"save"} onClick={() => this.props.editor.saveProtocol(pname)}>Save</Dropdown.Item>
                        <Dropdown.Item key={pname+"rename"} onClick={() => this.props.editor.renameProtocol(pname)}>Rename</Dropdown.Item>
                        <Dropdown.Item key={pname+"graph_download"} onClick={() => this.props.editor.downloadGraph(pname)}>Download Rete Graph</Dropdown.Item>
                        <Dropdown.Item key={pname+"protocol_download"} onClick={() => this.props.editor.handleProtocolDownload(pname)}>Download Protocol</Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item key={pname+"del"} onClick={() => this.props.editor.deleteProtocol(pname)}>Delete</Dropdown.Item>
                      </SplitButton>
                      // <Nav.Item>
                      //   <Nav.Link eventKey={pname}>{pname}</Nav.Link>
                      // </Nav.Item>
                    )
                })
    let emptyTab = (
      <Nav.Item>
        <SplitButton size="sm" variant="outline-primary" title={emptyProtocol} onClick={() => this.props.editor.displayNewProtocol()}>
          <Dropdown.Item key={"load-rete-graph-file"} onClick={() => this.fileInput.current.click()}>Import from Rete Graph</Dropdown.Item>
        </SplitButton>
      </Nav.Item>
    )


    let tabcontainer = (
      <Tab.Container id="protocol-inspector-group"
                    activeKey={this.props.currentProtocol}>
        {/* <Col> */}
          <Row  xs={1} sm={1}>
            <Nav id="editor-protocol-tabs" variant="pills" className="flex-row"
                onSelect={(k) => {
                  if (k === emptyProtocol) {
                    this.props.editor.displayNewProtocol();
                  } else {
                  this.props.editor.displayProtocol(k)
                  }}}>
              {tabs}
              {emptyTab}
            </Nav>
          </Row>
          <Row className='editor-workspace-inspector-row'>
            <Col  xs={12} sm={12} className="editor-workspace-column">
            {/* <h1>HI</h1> */}
              {this.props.workspaceComponent()}
            </Col>
            {/* <Col xs={3} sm={3} className='editor-inspector-column'>
              <Row>
            <Tab.Content>
              {Object.entries(this.props.protocols).map(
                ([pname, protocol], i)  =>  (
                  <Tab.Pane key={i} eventKey={pname}>
                      <ProtocolInspector key={pname} protocol={protocol} />
                  </Tab.Pane>
                ))}
              <Tab.Pane eventKey={emptyProtocol}>
                <ProtocolInspector key={emptyProtocol}
                          protocol={{emptyProtocol: {"graph" : {}}}}
                          />
              </Tab.Pane>
            </Tab.Content>
            </Row>
            </Col> */}
          </Row>

        {/* </Col> */}
          <input type="file" ref={this.fileInput} onChange={(evt) => this.loadProtocolFromFile(evt)} style={{display: "none"}}/>
      </Tab.Container>
    )
    return tabcontainer
  };
}

function ProtocolInspector(props) {
  return (
    <div>
      <pre>
        {JSON.stringify(props.protocol.graph, null, 2)}
      </pre>
    </div>
  );

};