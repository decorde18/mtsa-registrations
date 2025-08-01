import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }

  html {
    font-size: 62.5%; /* 1rem = 10px */
    height: 100%;
  }

  html, body {
    margin: 0;
    padding: 0;
    font-family: ${({ theme }) => theme.fonts.body};
    background-color: ${({ theme }) => theme.colors.background};
    color: ${({ theme }) => theme.colors.text};
    height: 100vh;
    transition: background-color 0.3s ease, color 0.3s ease;
    display: flex;
    flex-direction: column;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    padding: ${({ theme }) => theme.spacing.paddingSmall} ${({ theme }) => theme.spacing.paddingMedium};
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    font-size: ${({ theme }) => theme.fontSize.button};
    transition: background-color 0.2s;
    
    &:hover {
      background-color: ${({ theme }) => theme.colors.accentHover};
    }

    &.primary {
      background-color: ${({ theme }) => theme.colors.primary};
      color: ${({ theme }) => theme.colors.white};
    }
    
    &.secondary {
      background-color: ${({ theme }) => theme.colors.white};
      color: ${({ theme }) => theme.colors.primary};
      border: 1px solid ${({ theme }) => theme.colors.primary};
    }
  }

  form {
    display:flex;
    flex-direction:column;
  }
  
  input, textarea{
    padding: ${({ theme }) => theme.spacing.paddingMedium};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    border: 1px solid ${({ theme }) => theme.colors.border};
    font-size: ${({ theme }) => theme.fontSize.input};
    width: 100%;
    box-sizing: border-box;
    margin-bottom: ${({ theme }) => theme.spacing.paddingSmall};
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.white};
    
    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
      box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.shadowPrimary};
    }
  }
  
  select {
    padding: ${({ theme }) => theme.spacing.paddingMedium};
    border: 1px solid ${({ theme }) => theme.colors.white};
    border-radius: ${({ theme }) => theme.borderRadius.default};
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.white};
    font-size: ${({ theme }) => theme.fontSize.subtitle};
    width: 100%;
    @media (max-width: 768px) {
      width: 65%;
    font-size: 1.2rem;
    padding: ${({ theme }) => theme.spacing.paddingSmall};
  }}
  
  label {
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: ${({ theme }) => theme.spacing.paddingSmall};
    font-size: ${({ theme }) => theme.fontSize.label};
    @media (max-width: 768px) {

    font-size: 1.2rem;
  }
  }

  /* Header Styles */
  header {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.white};
    box-shadow: 0px 4px 8px ${({ theme }) => theme.colors.shadow};
  }

  /* Main Content Area */
  main {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    flex-grow: 1;
    padding-bottom: 2rem;
    overflow-y: auto;
    margin: 5rem;
  }

  /* Footer Styles */
  footer {
    background-color: ${({ theme }) => theme.colors.secondary};
    color: ${({ theme }) => theme.colors.white};
    padding: ${({ theme }) => theme.spacing.paddingMedium};
    text-align: center;
    box-shadow: 0px -2px 8px ${({ theme }) => theme.colors.shadow};
  }

  /* Print Styles */
  @media print {
    footer,
    .noprint {
      display: none;
    }
  }

  /* Mobile Styles */
  @media (max-width: 768px) {
    main {
      margin: 1rem;
    }
    
    h1 {
      font-size: ${({ theme }) => theme.fontSize.title};
    }
  }

  /* Dark theme support (if you want to add it later) */
  [data-theme="dark"] & {
    background-color: ${({ theme }) => theme.dark?.background || theme.colors.background};
    color: ${({ theme }) => theme.dark?.text || theme.colors.text};
  }
`;
