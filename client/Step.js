import React from "react";
import _ from "lodash";
import { Tours, Steps } from '../collections';
import { createContainer } from 'meteor/react-meteor-data';
import { Link } from 'react-router';

import Snippet from './Snippet';
import Section from './Section';

class Step extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      highlightLineNumbers: []
    };
  }

  onSelect(section) {
    this.setState({
      highlightLineNumbers: _.range(parseInt(section.lineStart, 10), parseInt(section.lineEnd, 10) + 1)
    });
  }

  getStepNumber(slug) {
    return _.indexOf(this.props.tour.steps, slug) + 1;
  }

  getStepLink(step) {
    return `/tour/${this.props.tour.repository}/${step}`;
  }

  getTourLink() {
    return `/tour/${this.props.tour.repository}`;
  }

  getNextStepLink() {
    const curIndex = _.indexOf(this.props.tour.steps, this.props.step.slug);
    const nextStep = this.props.tour.steps[curIndex + 1];
    if (nextStep) {
      return (
        <Link className="next-step" to={this.getStepLink(nextStep)}>
          Next: {this.props.step.getNextStep().getFullTitle()}
        </Link>
        );
    } else {
      return <Link className="next-step" to={this.getTourLink()}>Back to Tour</Link>;
    }
  }

  getPrevStepLink() {
    const curIndex = _.indexOf(this.props.tour.steps, this.props.step.slug);
    const prevStep = this.props.tour.steps[curIndex - 1];
    if (prevStep) {
      return (
        <Link to={this.getStepLink(prevStep)}>
          Next: {this.props.step.getPrevStep().getFullTitle()}
        </Link>
        );
    } else {
      return <Link to={this.getTourLink()}>Back to Tour</Link>;
    }
  }

  render() {
    if (!this.props.step) {
      return <div>Loading...</div>
    }

    return (
      <div>
        {this.getPrevStepLink()}
        {this.getNextStepLink()}
        <h1>{this.props.step.getFullTitle()}</h1>
        <div className="left">
          <div>URL: {this.props.step.codeUrl}</div>
          <div>Commit: {this.props.step.commit}</div>
          <Snippet
            code={this.props.step.code}
            highlightLineNumbers={this.state.highlightLineNumbers}/>
        </div>
        <div className="right">
          {
            _.map(this.props.step.content, (section, index) => {
              return (
                <Section key={index} section={section} onSelect={this.onSelect.bind(this, section)} />
              );
            })
          }
          {this.getNextStepLink()}
        </div>
      </div>
    );

  }
}

const StepContainer = createContainer(({ params }) => {
  const tourName = `${params.user}/${params.repoName}`;
  Meteor.subscribe('steps', tourName);
  return {
    step: Steps.findOne(
      {
        tourName,
        slug: params.stepSlug
      }
    ),
    tour: Tours.findOne({
      repository: tourName
    })
  }
}, Step);


export default StepContainer;
