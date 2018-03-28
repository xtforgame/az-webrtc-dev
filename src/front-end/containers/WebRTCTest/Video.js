import React from 'react';

export default class Video extends React.Component {
  constructor(...args){
    super(...args);
    this.state = {};
  }

  componentDidMount(){
    let { srcObject } = this.props;
    if(this.elem.srcObject !== srcObject){
      this.elem.srcObject = srcObject;
    }
  }

  componentDidUpdate(){
    let { srcObject } = this.props;
    if(this.elem.srcObject !== srcObject){
      this.elem.srcObject = srcObject;
    }
  }

  render() {
    let { srcObject, ...rest } = this.props;
    return (
      <video ref={(elem) => this.elem = elem} {...rest} />
    );
  }
}
