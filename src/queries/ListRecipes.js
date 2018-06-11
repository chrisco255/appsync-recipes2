import graphql from 'graphql-tag';

export default graphql`
	query listRecipes{
		listRecipes {
			items {
				id
				name
				ingredients
				directions
			}
		}
	}
`;