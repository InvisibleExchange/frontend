import React, { useState } from "react";
import classNames from "classnames";
import styles from "./ContactForm.module.css";
import { useForm, ValidationError } from "@formspree/react";

import "react-tooltip/dist/react-tooltip.css";
import { Tooltip as ReactTooltip } from "react-tooltip";

const ContactForm = () => {
  const [state, handleSubmit] = useForm("mdoyqrkw");
  if (state.succeeded) {
    return (
      <p className="w-11/12 mx-8 mt-10 text-2xl font-semibold tracking-wide text-center whitespace-pre-wrap font-work md:mt-20 md:mx-4 md:text-3xl">
        Your message has been forwarded to the team. Thank you for your
        feedback!
      </p>
    );
  }

  return (
    <div className={styles.contactForm}>
      <div className="w-11/12 2xl:w-5/12 xl:w-6/12 lg:mb-20 lg:w-9/12 md:w-10/12">
        <p className="mx-8 mt-10 text-4xl font-semibold tracking-wide text-center whitespace-pre-wrap font-work md:mt-20 md:mx-4 md:text-5xl">
          Contact Us
        </p>
        <p className="mt-4 text-base font-light tracking-wide text-center md:text-xl ">
          Let us know if you have any questions or feedback.
        </p>

        <div className="flex flex-col items-center mt-10">
          <form className="w-10/12" method="POST" onSubmit={handleSubmit}>
            <div className="mb-5">
              <label
                htmlFor="name"
                className="block mb-2 text-sm font-normal font-work"
              >
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                name="name"
                className="w-full px-2 py-2.5 text-base tracking-wider shadow-md rounded-lg border-y border-x dark:border-0 dark:text-foreground-900 bg-foreground-100 dark:border-foreground-400 border-background-600 font-work focus-visible:outline-none focus:ring-2 focus:ring-primary-800"
                placeholder="John Smith"
                // required
              />
              <ValidationError
                prefix="Name"
                field="name"
                errors={state.errors}
              />
            </div>

            <div className="mb-5">
              <label htmlFor="email" className="block mb-2 text-sm font-work">
                Email (optional)
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="w-full p-2 text-base tracking-wider rounded-lg shadow-md border-y border-x dark:border-0 dark:text-foreground-900 bg-foreground-100 dark:border-foreground-400 border-background-600 font-work focus-visible:outline-none focus:ring-2 focus:ring-primary-800"
                placeholder="john.smith@email.com"
                // required
              />
              <ValidationError
                prefix="Email"
                field="email"
                errors={state.errors}
              />
            </div>

            <div className="mb-5">
              <label htmlFor="subject" className="block mb-2 text-sm font-work">
                Subject
              </label>
              <input
                id="subject"
                type="text"
                name="subject"
                className="w-full p-2 text-base tracking-wider rounded-lg shadow-md border-y border-x dark:border-0 dark:text-foreground-900 bg-foreground-100 dark:border-foreground-400 border-background-600 font-work focus-visible:outline-none focus:ring-2 focus:ring-primary-800"
                placeholder="Write your subject here."
                required
              />
              <ValidationError
                prefix="Subject"
                field="subject"
                errors={state.errors}
              />
            </div>

            <div className="mb-5">
              <label htmlFor="message" className="block mb-2 text-sm font-work">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                className="w-full p-2 text-base tracking-wider shadow-md min-h-[150px] rounded-lg border-y border-x dark:border-0 dark:text-foreground-900 bg-foreground-100 dark:border-foreground-400 border-background-600 font-work focus-visible:outline-none focus:ring-2 focus:ring-primary-800"
                placeholder="Write your message here."
                required
              />
              <ValidationError
                prefix="Message"
                field="message"
                errors={state.errors}
              />
            </div>

            <button
              type="submit"
              disabled={state.submitting}
              className={classNames(
                " py-2.5 px-4 font-work font-medium text-sm float-right tracking-wide",
                styles.button
              )}
            >
              Send{" "}
              {/* <ArrowNarrowRightIcon className="inline-block w-4 h-4 mb-px ml-px" /> */}
            </button>
          </form>
        </div>

        {/* <ReactTooltip id="restore-state-tooltip" opacity={1} />
        <p className="mt-10 pt-10 text-base font-light tracking-wide text-center md:text-xl ">
          If you encounter any problems with your balances or open positions,
          you can can try to
          <button
            data-tooltip-id="restore-state-tooltip"
            data-tooltip-content="You can always run this computation to restore your account to the current state."
            type="submit"
            disabled={state.submitting}
            className={classNames(
              "ml-3 py-1 px-2 tracking-wide " + styles.button
            )}
          >
            Restore your account
          </button>
        </p> */}
      </div>
    </div>
  );
};

export default ContactForm;
