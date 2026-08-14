document.addEventListener("DOMContentLoaded", () => {
  const toolsPage = document.querySelector("[data-tools-page]");

  if (!toolsPage) {
    return;
  }

  const buttons = Array.from(toolsPage.querySelectorAll("[data-filter-kind]"));
  const cards = Array.from(toolsPage.querySelectorAll("[data-tool-card]"));
  const sections = Array.from(toolsPage.querySelectorAll("[data-tool-section]"));
  const emptyState = toolsPage.querySelector("[data-tool-empty]");

  const applyFilter = (kind, value) => {
    let visibleCount = 0;

    cards.forEach((card) => {
      const isVisible = kind === "all" || card.getAttribute(`data-${kind}`) === value;
      card.hidden = !isVisible;
      visibleCount += isVisible ? 1 : 0;
    });

    sections.forEach((section) => {
      const sectionCards = Array.from(section.querySelectorAll("[data-tool-card]"));
      section.hidden = !sectionCards.some((card) => !card.hidden);
    });

    buttons.forEach((button) => {
      const isActive = button.dataset.filterKind === kind && button.dataset.filterValue === value;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (emptyState) {
      emptyState.hidden = visibleCount !== 0;
    }
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      applyFilter(button.dataset.filterKind, button.dataset.filterValue);
    });
  });
});
