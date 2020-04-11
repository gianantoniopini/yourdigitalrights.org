import CircularProgress from "@material-ui/core/CircularProgress";
import { Component } from "react";
import Downshift from "downshift";
import { FormattedMessage } from "react-intl";
import Icon from "@material-ui/core/Icon";
import Input from "@material-ui/core/Input";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import MenuList from "@material-ui/core/MenuList";
import Paper from "@material-ui/core/Paper";
import debounce from "../../utils/debounce";
import fetchSheetData from "../../utils/sheets";
import styles from "./styles";
import tracker from "../../utils/tracking";
import { withStyles } from "@material-ui/core/styles";
import Link from 'next/link'


class Form extends Component {
  state = {
    searchResults: [],
    companyNameSearch: "",
    companiesLoaded: false
  };

  constructor(props) {
    super(props);

    this.searchRef = React.createRef();
    this.debounceSearch = debounce(search => {
      tracker.trackSearch(search);
    }, 100);
  }

  focus() {
    let state = Object.assign({}, this.state);
    state.companyNameSearch = "";
    this.setState(state);
    this.searchRef.current.focus();
  }

  async componentDidMount() {
    const companies = fetchSheetData();
    this.setState({ companies });
    await companies;
    this.setState({ companiesLoaded: true });
  }

  handleInput = e => {
    this.searchCompanies(e.target.value);
    this.setState({
      companyNameSearch: e.target.value
    });
  };
 
  async searchCompanies(search) {
    let searchResults = [];

    if (search) {
      const companies = await this.state.companies;
      searchResults = companies
        .filter(company => {
          return company.searchTerms.toLowerCase().match("^" + search.toLowerCase() + "|, *" + search.toLowerCase());
        })
        .slice(0, 5);
    } else {
      searchResults = [];
    }

    this.debounceSearch(search);

    this.setState({
      searchResults
    });
  }

  renderInput = InputProps => {
    const { classes, companies } = this.props;

    return (
      <FormattedMessage
        id="companyPlaceholder"
        defaultMessage="Search for an organization"
      >
        {label => (
          <div>
            <InputLabel htmlFor="companyNameSearch" className={classes.label}>
              {label}
            </InputLabel>
            <Input
              {...InputProps}
              id="companyNameSearch"
              onInput={this.handleInput}
              value={this.state.companyNameSearch}
              startAdornment={
                <InputAdornment position="start" className={classes.searchIcon}>
                  <Icon>search</Icon>
                </InputAdornment>
              }
              endAdornment={
                this.state.companyNameSearch && !this.state.companiesLoaded ? (
                  <CircularProgress className={classes.progress} size={24} />
                ) : null
              }
              disableUnderline={true}
              placeholder={label}
              fullWidth={true}
              className={classes.searchInputWrapper}
              autoComplete="off"
              inputRef={this.searchRef}
            />
          </div>
        )}
      </FormattedMessage>
    );
  };

  renderSuggestion = ({
    result,
    i,
    highlightedIndex,
    selectedItem,
    itemProps
  }) => {
    const isHighlighted = highlightedIndex === i;

    return (
      <Link href="/d/[domain]" as={`/d/${result.url}/`}>
        <MenuItem
          key={result.url}
          selected={isHighlighted}
          dense={true}
          onClick={() => console.log('going home')}
          {...itemProps}
        >
            <img
              role="presentation"
              src={`https://api.faviconkit.com/${result.url}/24`}
              width={24}
              height={24}
            />
            <ListItemText
              primary={`${result.name} (${result.url})`}
              id={`search-result-${result.url}`}
            />
        </MenuItem>
      </Link>
    );
  };

  render() {
    const { classes } = this.props;
    return (
      <form id="searchForm" className={classes.form}>
        <Downshift
          itemToString={result => result && result.name}
          defaultHighlightedIndex={0}
        >
          {({
            getInputProps,
            getItemProps,
            isOpen,
            inputValue,
            selectedItem,
            highlightedIndex
          }) => (
            <div>
              <Paper className={classes.results}>
                {this.renderInput(getInputProps())}
                {isOpen && (
                  <MenuList className={classes.list}>
                    {this.state.searchResults.length &&
                      this.state.searchResults.map((result, i) =>
                        this.renderSuggestion({
                          result,
                          i,
                          itemProps: getItemProps({ item: result }),
                          highlightedIndex,
                          selectedItem
                        })
                      )}
                    <MenuItem
                      button
                      selected={
                        highlightedIndex === this.state.searchResults.length
                      }
                      {...getItemProps({ item: {} })}
                    >
                      <a href="/d" >
                        <ListItemText>
                          <strong>
                            <FormattedMessage
                              id="noResults"
                              defaultMessage="Can't find an organization?"
                            />
                          </strong>{" "}
                          <FormattedMessage
                            id="noResultsMore"
                            defaultMessage="Click here to add one"
                          />
                        </ListItemText>
                      </a>
                    </MenuItem>
                  </MenuList>
                )}
              </Paper>
            </div>
          )}
        </Downshift>
      </form>
    );
  }
}
export default withStyles(styles)(Form);
