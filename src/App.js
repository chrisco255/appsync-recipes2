import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { compose, graphql } from 'react-apollo';
import ListRecipes from './queries/ListRecipes';
import CreateRecipe from './mutations/CreateRecipes';
import NewRecipeSubscription from './subscriptions/NewRecipeSubscription';
import uuid from 'uuid/v4';

class App extends Component {
	state = {
		name: '',
		ingredient: '',
		direction: '',
		ingredients: [],
		directions: [],
	}
	componentDidMount() {
		this.props.subscribeToNewRecipes();
	}
	onChangeText = (key, value) => {
		this.setState({ [key]: value });
	}
	addIngredient = () => {
		if (this.state.ingredient === '') { return; }
		const ingredients = [...this.state.ingredients, this.state.ingredient];
		this.setState({
			ingredients,
			ingredient: ''
		})
	}
	addDirection = () => {
		if (this.state.direction === '') { return; }
		const directions = [...this.state.directions, this.state.direction];
		this.setState({
			directions,
			direction: ''
		})
	}
	addRecipe = () => {
		const { name, ingredients, directions } = this.state;
		this.props.onAdd({
			name,
			ingredients,
			directions,
			id: uuid(),
		});
		this.setState({
			name: '',
			ingredient: '',
			direction: '',
		});
	}
  render() {
		console.log('props: ', this.props);
    return (
      <div className="App" style={styles.container}>
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        {
					this.props.recipes.map((recipe, index) => (
						<div key={index}>{recipe.name}</div>
					))
				}
				<input
					value={this.state.name}
					placeholder="Recipe Name"
					style={styles.input}
					onChange={evt => this.onChangeText('name', evt.target.value)}
				/>
				<input
					value={this.state.ingredient}				
					placeholder="Ingredient Name"
					style={styles.input}
					onChange={evt => this.onChangeText('ingredient', evt.target.value)}
				/>
				<button onClick={this.addIngredient} style={styles.button}>Add Ingredient</button>
				<input
					value={this.state.direction}				
					placeholder="Direction Name"
					style={styles.input}
					onChange={evt => this.onChangeText('direction', evt.target.value)}
				/>
				<button onClick={this.addDirection} style={styles.button}>Add Direction</button>				
				<button onClick={this.addRecipe} style={styles.button}>Add Recipe</button>
      </div>
    );
  }
}

const styles = {
	input: {
		fontSize: 22,
		height: 50,
		width: 450,
		borderBottom: '2px solid blue',
		margin: 10,
	},
	button: {
		height: 50,
		margin: 10,
		width: 450,
	},
	container: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
	},
};

export default compose(
	graphql(ListRecipes, {
		options: {
			fetchPolicy: 'cache-and-network'
		},
		props: props => ({
			recipes: props.data.listRecipes ? props.data.listRecipes.items : [],
			subscribeToNewRecipes: params => {
				props.data.subscribeToMore({
					document: NewRecipeSubscription,
					updateQuery: (prev, { subscriptionData: { data: { onCreateRecipe }} }) => ({
						...prev,
						listRecipes: {
							__typename: 'RecipeConnection',
							items: [onCreateRecipe, ...prev.listRecipes.items.filter(recipe => recipe.id !== onCreateRecipe.id)]
						}
					})
				})
			}
		})
	}),
	graphql(CreateRecipe, {
		props: props => ({
			onAdd: recipe => props.mutate({
				variables: recipe,
				optimisticResponse: {
					__typename: 'Mutation',
					createRecipe: { ...recipe, __typename: 'Recipe' }
				},
				update: (proxy, { data: { createRecipe }}) => {
					const data = proxy.readQuery({ query: ListRecipes });
					
					let hasBeenAdded = data.listRecipes.items.reduce((acc, item) => {
						if (item.id === createRecipe.id) {
							return true;
						} else {
							return false;
						}
					}, false);

					if (hasBeenAdded) { return; }

					data.listRecipes.items.push(createRecipe);
					proxy.writeQuery({ query: ListRecipes, data });
				}
			})
		})
	})
)(App);
