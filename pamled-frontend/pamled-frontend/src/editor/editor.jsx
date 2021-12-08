import Rete from "rete";
import ReactRenderPlugin from "rete-react-render-plugin";
import ConnectionPlugin from "rete-connection-plugin";
import ContextMenuPlugin from "rete-context-menu-plugin";
import DockPlugin from "rete-dock-plugin";
import AreaPlugin from "rete-area-plugin";

import { MyNode } from "./components/Node";
import { loadComponentsFromAPI, PAMLComponent } from "./components/Primitive";
import { ModuleComponent, InputComponent, OutputComponent, OutputFloatComponent } from "./components/Control";
import Menu from "./menu";

import React from "react";
import { Component } from "react";
import { Row, Col, Modal, Button, Container } from "react-bootstrap";
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import axios, { axios_csrf_options } from "../API";


export default class Editor extends Component {
  constructor(props) {
    super(props);
    this.palleteRef = React.createRef();
    this.workspaceRef = React.createRef();
    this.menuRef = React.createRef();
    
    this.editor = {};
    this.state = {
      showModal: false,
      currentProtocol: null,
      protocols: {},
      primitiveComponents: {}
    }

    this.processHandler = this.processHandler.bind(this);
  }

  componentDidMount() {
    //var editor = new Rete.NodeEditor("demo@0.1.0", document.querySelector('.editor'));
    this.editor = new Rete.NodeEditor("demo@0.1.0", this.workspaceRef.current);
    this.editor.use(ConnectionPlugin);
    this.editor.use(DockPlugin, {
      container: this.palleteRef.current,
      itemClass: 'item', // default: dock-item 
      plugins: [ReactRenderPlugin], // render plugins
    });
    this.editor.use(ReactRenderPlugin
      , {
      component: MyNode
    }
    );
    this.editor.use(ContextMenuPlugin);
    this.engine = new Rete.Engine("demo@0.1.0");

    this.editor.on("process nodecreated noderemoved connectioncreated connectionremoved", this.processHandler);

    
    this.editor.view.resize();
    AreaPlugin.zoomAt(this.editor);
    this.editor.trigger("process");
    this.initializeComponents();
    this.retreiveProtocols();
    //this.setProtocol(null);  // Initialize the empty protocol
  }

  componentWillUnmount() {
    this.editor.destroy();
  }

  async processHandler() {
    console.log("process");
    await this.engine.abort();
    await this.engine.process(this.editor.toJSON());
  }

  async initializeComponents() 
  {
    let components = await loadComponentsFromAPI(); //[new AddComponent()];
    components = components.map((primitive) => {
      let c = new PAMLComponent(primitive);
      // c.builder = function(node) {
      //   return node;
      // }
      return c;
    });
    components = components.concat([ 
      new InputComponent(),
      new ModuleComponent(),
      new OutputComponent(),
      new OutputFloatComponent(),
    ]) ;

    components.map(c => this.addComponent(c));
  }

  addComponent(component){
    if (Object.keys(this.state.primitiveComponents).indexOf(component.name) < 0){
      var components = this.state.primitiveComponents;
      components[component.name] = component;
      this.editor.register(component);
      this.engine.register(component);
      this.setState({components: components});      
      }
  }

  initialGraph () {
    return { id: "demo@0.1.0", nodes: {} };
  }

  setProtocol(protocol){
    
      // Create a new protocol if none specified
    if (!protocol) {
      protocol = "New Protocol " + Object.keys(this.state.protocols).length;
      this.state.protocols[protocol] = { name: protocol, 
                                         graph: this.initialGraph(), 
                                         rdf_file: null
                                        }
    }

    // If there is a current protocol, then save its graph as JSON.
    if(this.state.currentProtocol) {
      this.state.protocols[this.state.currentProtocol].graph = this.editor.toJSON();
      this.setState({protocols: this.state.protocols})
    }

    // Update the current protocol, load graph, and update state.
    this.state.currentProtocol = protocol;
    this.editor.fromJSON(this.state.protocols[protocol].graph);
    this.setState({currentProtocol: protocol});
  }

  async saveProtocol(){
    this.setState({showModal: true})

    axios
        .post("/protocol/", Object.values(this.state.protocols))
        .then(function (response) { 
          return response.data;
        })
        .catch(function (error) {
          // handle error
          console.log(error);
          return [];
        });
  }

  async retreiveProtocols(){
    var protocols = await axios.get("/protocol/", axios_csrf_options)
                        .then(function (response) { 
                          return response.data;
                        })
                        .catch(function (error) {
                          // handle error
                          console.log(error);
                          return [];
                        });
    console.log(typeof protocols);
    // protocols.map((p) => {
    //   //p.graph = JSON.parse(p.graph); // read json serialized as string
    //   this.updateProtocol(p);
    // });
  }

  async rebuildPrimitives(){
    await axios.get("/rebuild/")
                        .then(function (response) { 
                          return response.data;
                        })
                        .catch(function (error) {
                          // handle error
                          console.log(error);
                          return [];
                        });
    this.initializeComponents()
  }

  updateProtocol(protocol){
    var currentProtocols = this.state.protocols;
    currentProtocols[protocol.name] = protocol;
    this.setState({protocols: currentProtocols});  
  }


  getProtocols(){
    return Object.keys(this.state.protocols);
  }

  render() {
    var protocolTabs = this.getProtocols().map((p) => {
      return (
        <Tab eventKey={p} title={p}> 
          <div><pre>{JSON.stringify(this.state.protocols[p].graph, null, 2) }</pre></div>
        </Tab>);
    });

    return (
      <Container fluid>
      <Menu 
        ref={this.menuRef}
        editor={this}
        // handleSave={this.saveProtocol.bind(this)}
        // protocolName={this.state.currentProtocol}
        // getProtocols={this.getProtocols.bind(this)}
        // setProtocol={this.setProtocol.bind(this)}
        />
      <Row lg={12}>
        <Col lg={2} className="editor-pallete">
          <div ref={this.palleteRef}/>
        </Col> 
        
        <Col lg={8}>
          <Row>
          <div className="editor-workspace" ref={this.workspaceRef} data-toggle="tab"/>
          </Row>
          <Modal show={this.state.showModal} onHide={() => this.setState({showModal: false})}>
            <Modal.Header closeButton>
              <Modal.Title>Saved Protocol</Modal.Title>
            </Modal.Header>
            <Modal.Body>Saved!</Modal.Body>
            <Modal.Footer>
              <Button variant="primary" onClick={() => this.setState({showModal: false})}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </Col>
      </Row>
      <Row>
        <Col>
          <Row>
            <Tabs defaultActiveKey={this.state.currentProtocol} 
                onSelect={(k) => {this.setProtocol(k)}}
                className="mb-3">
            {protocolTabs}
            </Tabs>
          </Row>
        </Col>
      </Row>
      </Container>
    );
  }
}


